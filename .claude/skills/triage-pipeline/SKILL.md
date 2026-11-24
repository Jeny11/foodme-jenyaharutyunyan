---
name: triage-pipeline
description: Run a full bug-triage investigation for a FoodMe Jira ticket or a described production problem (/triage-pipeline <KEY or description>). The main session confirms the problem with the human, dispatches triage-worker subagents for evidence (Playwright, GlitchTip, Loki, Prometheus, git), forms and tests root-cause hypotheses, has triage-judge review them, presents rated candidates with artifacts, and writes back to Jira only after human approval. Use when the user says "triage", "/triage-pipeline", or gives a ticket key to investigate. Not for designing or running test cases.
---

# Triage pipeline (you, the main session, are the brain)

Argument: a Jira key (e.g. `KAN-123`), a GlitchTip issue (`<project>/<id>`, from `daily-triage`) or a free-text problem description.

## Unattended mode

When called by the `daily-triage` skill with `unattended: true` (CI, no human):

- Never use AskUserQuestion. Every gate (Phase 0 confirm, Phase 3 approval) is replaced by the "Unattended rules" table in `daily-triage`; follow that table, not the gate text below.
- Jira tools in CI are `mcp__jira__*` (mcp-atlassian), not the claude.ai Atlassian MCP (`getJiraIssue`, `addOrEditJiraIssueComment`, …). Use the `mcp__jira__*` equivalent of every Jira call named below.
- Phase 4 becomes "create the bug described in `daily-triage`"; don't comment on or transition other issues.

## Hard rules

- You never call Playwright, Grafana or GlitchTip yourself. All evidence comes from `triage-worker` subagents. That keeps your context clean for reasoning.
- Subagents cannot spawn subagents, so you do all of the orchestration.
- Nothing is written to Jira before the human explicitly approves (Gate 2).
- Every claim you show the human must point to an artifact file.
- You investigate; you never fix. Don't edit app code, don't commit and don't push (a push redeploys on Render).
- Case folder: `agentic-workflows/triage/<KEY or short-slug>/` (for a GlitchTip issue: `agentic-workflows/triage/glitchtip-<project>-<id>/`) with `problem.md`, `briefs/`, `evidence/`, `hypotheses.md`, `judge.md`, `report.md`.

## FoodMe context (put the relevant parts in every brief)

- **Services.** Backend `foodme-backend` (Spring Boot, Loki label `app="foodme-backend"`), storefront `apps/web`, admin `apps/admin`, all on Render. Monitoring is one Render service `foodme-monitoring` (Grafana, Prometheus, Loki) reached through the Grafana MCP.
- **Known noise. Exclude it from every query and never treat it as a candidate:**
  - Backend `FlakyHeartbeatJob`: about 1 in 10 runs logs `WARN Heartbeat job '<scenario>' failed (demo)` (followed by a stack trace with `Simulated failure during …`) and sends `IllegalStateException: Simulated failure during …` to GlitchTip. The scenarios are nightly payout reconciliation, chef availability sync, order settlement batch, menu search reindex and delivery ETA recompute.
  - Storefront `flakyHeartbeat` (`apps/web/src/lib/flakyHeartbeat.ts`): about 1 in 10 ticks sends `Error: Storefront background task failed: <scenario>` to the GlitchTip `web` project.
  - Admin `flakyHeartbeat` (`apps/admin/src/lib/flakyHeartbeat.js`): about 1 in 10 ticks sends `Error: Admin background task failed: <scenario>` to the GlitchTip `admin` project.
  - `/api/debug/boom` (`DebugController`): a deliberate error endpoint. Never call it. Ignore its events.
- **Seeded bugs.** The codebase contains deliberate defects marked `FM-BUG-NN` / `FM-FLAKE-NN`. When a hypothesis points at code, have a worker grep for these markers near it. If one matches, record the marker in `hypotheses.md`, `report.md` and the Jira comment. Don't fix it.
- **Recent changes.** Render restarts and deploys are not Prometheus metrics. Use `git log` (commits on `main` deploy to Render) and the ticket for the change timeline, and use the Prometheus `up` gaps only as a hint.
- **No sleeps.** Playwright reproductions wait on page conditions (text, element, network response), never a fixed time.

## Phase 0: Intake and confirm (Gate 1)

1. If a Jira key was given, read it with the Atlassian MCP (`getJiraIssue`, plus `listJiraIssueComments`). If the Atlassian MCP fails, tell the human and stop; don't guess the ticket.
2. Write `problem.md`:
   - Symptom (what the user sees), expected vs actual
   - App (storefront / admin / API), URL or endpoint
   - Who is affected (all / some users / one role), frequency
   - Time window in UTC (first seen, still happening?)
   - Known recent changes (deploys, config, feature flags) if mentioned
   - Open questions
3. Show the summary to the human and ask them to confirm or correct it (use AskUserQuestion for the unclear points).
4. Don't start Phase 1 until they confirm.

## Phase 1: Investigate (briefs, then hypotheses, then tests)

### Round 1: broad evidence

Write one brief per source in `briefs/B<n>.md` and launch the `triage-worker` subagents in parallel (several Agent calls in one message). Typical first round:

| Brief | Source | Question |
|---|---|---|
| B1 | Playwright | Reproduce the symptom; capture screenshot, console and network |
| B2 | GlitchTip | Matching issues in the window: stack traces, first/last seen, release (backend/storefront/admin heartbeats and boom excluded) |
| B3 | Loki | Error/warn logs for `app="foodme-backend"` in the window (heartbeat lines and their `Simulated failure during` stack traces excluded) |
| B4 | Prometheus | Error rate, latency p95/p99, JVM memory, DB connection pool, `up` gaps around the window |
| B5 | Code / git | Commits touching the affected area before first-seen; `FM-BUG`/`FM-FLAKE` markers in the suspect code |

Each brief must be self-contained (the worker can't see this conversation): brief ID, case folder, question, source, scope, exact UTC window, the noise to exclude, hypotheses under test, and the output path `evidence/B<n>/`.

### Form hypotheses

From the worker reports, write `hypotheses.md` with H1..Hn. For each one:

- **Mechanism:** how this would cause the symptom
- **Evidence for / against:** artifact paths
- **Prediction:** "if Hn is true we should also see X; if false we'd see Y"
- **Seeded-bug marker:** `FM-BUG-NN` / `FM-FLAKE-NN` or "none found"
- **Proposed rating** (rubric below)

### Round 2+: test

Send targeted test briefs (e.g. "query the Hikari active-connections metric 09:50–10:15 UTC; if H2 is true it should hit max before 10:02") and update `hypotheses.md`. At most 3 investigation rounds; then go to Phase 2 with what you have.

### Rating rubric

| Rating | Confidence | Needs |
|---|---|---|
| High | ≥ 80 % | reproduced or directly observed + timeline fits + mechanism explained + a falsification test passed |
| Medium | 40–79 % | consistent evidence and timeline, but no falsification test, or the mechanism is partly inferred |
| Low | < 40 % | circumstantial / correlation only |
| Refuted | 0 % | a prediction failed. Keep it in the list. |

## Phase 2: Judge

1. Launch the `triage-judge` subagent with the case folder path only. Don't argue the case to it in the prompt. Save its reply to `judge.md`.
2. If the verdict is `REVISE`, run its "required extra checks" through `triage-worker`, update `hypotheses.md`, and call the judge again. Max 2 judge loops.
3. Use the judge's ratings in the final report. Where you disagree, show both ratings and say why.

## Phase 3: Present (Gate 2)

Write `report.md` and show the human every candidate, refuted ones included:

| # | Root-cause candidate | Rating (conf. %) | Judge verdict | Seeded marker | Key artifacts | What would change this |
|---|---|---|---|---|---|---|

Under the table: a 3–5 line summary of the most likely cause, reproduction steps, the timeline, and open gaps.

Then ask: **Approve to write to Jira / Edit first / Reject (investigate more)**. Wait for an explicit answer.

## Phase 4: Write back to Jira (only after approval)

1. Add a comment to the issue (`addOrEditJiraIssueComment`) containing: confirmed problem, the candidate table, the most likely root cause (with its `FM-BUG`/`FM-FLAKE` marker if any), evidence (queries and artifact names), reproduction steps, judge verdict, and suggested next actions.
2. Change fields, labels, assignee or status only if the human asked for it (ask before `transitionJiraIssue`).
3. If there was no ticket and the human wants one, file it with the `jira-bug-reporting` skill.
4. Confirm to the human what was written, with a link to the issue.
