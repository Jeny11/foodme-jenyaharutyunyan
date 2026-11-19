---
name: foodme-storefront-bug-reports
description: How to write Jira bug reports for the FoodMe user storefront (customer web app at /). Defines scope, fields, writing rules, severity/priority, evidence and quality checks. Not for the admin backoffice.
---

# Writing Jira bug reports — FoodMe storefront


## Before writing
1. Reproduce the bug at least twice. Note whether it happens every time or only sometimes (e.g. 3 of 5 tries).
2. Find the **expected** behaviour in its source. Never use opinion.
3. Isolate the bug: smallest set of steps, one defect per ticket. Check whether it happens only on the client, only on the server, or both (DevTools → Network).
4. Look for duplicates in Jira, matching on module, endpoint and error text. If the code has an `FM-BUG-` or `FM-FLAKE-` marker for this behaviour, put it in the ticket.
5. If a Jira tool is connected, ask for the project key if it wasn't given, show the user the draft, and create the issue only after they confirm.

## Bug report format

| Field | What to write |
|---|---|
| Title | `[CODE]` plus the observed problem, ≤ 100 chars. e.g. `[CHK] Order total ignores additions when quantity > 1` |
| Issue type | Bug |
| Component / Labels | Component code: `HDR`, `HOME`, `EXP`, `CHEF`, `DISH`, `CART`, `AUTH`, `CHK`, `OST`, `ORD`, `TRK`, `XC` or `API`; labels `storefront`, plus `regression`, `flaky`, `security` where they apply |
| Environment | URL (local/Render), build or commit, browser + version, OS, viewport, signed in or out |
| Preconditions | The specific conditions that must be true for the bug to occur: Concrete auth state, cart contents (chef + dish + qty), admin-set data |
| Steps to reproduce | Numbered, one action per step, starting from a URL, controls named by visible label: `Click "Place order"` |
| Reproducibility | Every time, or a count such as `3 of 5 tries` |
| Actual result | What happens, observably: exact UI text, URL, values, console/network error (status + endpoint + message) |
| Expected result | The correct behaviour, with its source (requirement, test case ID, or a code rule that isn't the defect itself) |
| Severity / Priority | See below |
| Evidence | Screenshot or recording with the problem marked; HAR or request/response for API bugs; console log; order number / customer email used |
| Notes | Workaround, impact, linked test case|

## Severity
- **Critical:** blocks ordering or sign-in for everyone; data loss; wrong money charged; security or privacy exposure.
- **Major:** a core feature is broken or wrong for some users, with a workaround that's hard to use; totals or delivery fee inconsistent between screens.
- **Minor:** a non-core feature is broken; a validation gap; an error state without a retry.
- **Trivial:** copy, layout, cosmetic, small a11y issues.

Priority (Highest → Lowest) is set from severity × how often it happens × how many users it reaches. If the two differ, say why in Notes.

## Writing rules
- One defect per ticket. Link related tickets; don't merge them.
- Quote the actual and expected results exactly (text, `5,000 AMD`, URL). Don't explain the code's internals in place of the observed behaviour.
- Steps must reproduce the bug for someone new to the app, from a fresh state (clean storage or a new account).
- Use real data from the run (order `FM-xxxxxx`, dish name, test email). Don't make values up, and never include real passwords or tokens.
- Write in neutral, factual language. Don't blame anyone.

## Output
- **Default:** a Jira-ready draft in Markdown, one block per bug, with the fields in the order above.
- **Jira connected:** after the user confirms, create the issue with these fields mapped. Return the issue key and link.
- **Several bugs:** a summary table (Title | Component | Severity | Priority | Reproducibility), then the full reports.

## Final check
- [ ] Storefront only; admin actions appear only as preconditions
- [ ] Reproduced, isolated, one defect, duplicates checked
- [ ] Actual and expected results are observable, and the expected result cites its source
- [ ] Environment, reproducibility and evidence are attached
- [ ] Severity and priority follow the rules; no secrets in the ticket
