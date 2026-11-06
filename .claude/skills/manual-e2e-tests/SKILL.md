---
name: manual-e2e-tests
description: Write manual end-to-end test cases for FoodMe. Use when verifying complete user journeys across the application, from initial user action to the final business outcome, including workflows involving the storefront and admin panel. Not for writing or running the Playwright suites.
---

# Writing End-to-End Tests

**Environments:** locally, the storefront runs at `http://localhost:5180`, Admin at `http://localhost:5174` and the backend at `http://localhost:8081` (the ports the Playwright configs use). On a deployed build, Admin is at `/backoffice`. **Accounts:** register a customer with a new unique email. Log in to Admin locally as `admin` / `admin123`.

**Seeded bugs:** the code contains deliberate defects marked `FM-BUG-NN` and `FM-FLAKE-NN`. Expected results describe the intended behaviour, not what the marked code does. Report a failure as a finding with its marker.

**Execution:** write the cases, and run them only if the user asks. Unexecuted cases are **Not Run**. Never mark a case Pass without observing the result, and never invent results or evidence.

1. **Analyze the user journey:** Review requirements, identify the user goal, starting point, involved roles, and expected final outcome. Clarify ambiguous requirements before writing tests.

2. **Define test cases:** Use descriptive names and specify the environment, test accounts, preconditions, and test data. Use separate browser profiles when testing multiple roles.

3. **Document execution steps:** Write numbered steps covering the complete UI journey. Include observable expected results at key stages. For cross-interface workflows, use the same order or record ID to verify consistency.

4. **Cover alternative scenarios:** Test the main successful journey and relevant interruptions, such as validation errors or failed submissions. Verify recovery where applicable. Keep scenarios independent.

## Checklist

- [ ] Each case has a clear user goal and expected final outcome.
- [ ] Roles, preconditions, and test data are specified.
- [ ] Steps cover the complete user journey.
- [ ] Expected results are observable at key stages.
- [ ] Cross-interface data consistency is verified.
- [ ] Happy paths and relevant negative scenarios are covered independently.

## Report

Summarize journeys covered, environment/build, execution results, defects, and coverage gaps. Include relevant evidence, such as order IDs or screenshots.

**Statuses:**
- **Pass** — Actual result matches expected behavior.
- **Fail** — Actual result differs from expected behavior.
- **Not Run** — Test has not been executed.
- **Blocked** — Required environment, account, or test data is unavailable.
