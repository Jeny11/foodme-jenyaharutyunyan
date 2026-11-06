# FoodMe

Skills live in `.claude/skills/`. For automated integration tests, use `foodme-integration-tests`.

## Rules for test work
- **Seeded bugs (`FM-BUG`/`FM-FLAKE`).** Assert the intended behavior. Report failures as findings with the marker. Don't fix them in passing.
- **Questionable documented behavior.** For example, `/admin/**` accepts any role. Flag it and ask which behavior to assert.
- **Off-limits.** Never test the heartbeat jobs or `/api/debug/boom`. Never use sleeps. Never commit or push, because a push redeploys on Render.
