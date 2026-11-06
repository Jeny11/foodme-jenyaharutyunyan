---
name: manual-integration-tests
description: Write manual integration test cases for FoodMe. Use when a feature, change, or bug fix affects communication, data exchange, or shared state between system components, including frontend-to-API requests, backend persistence, and customer/admin interfaces. For automated tests, use foodme-integration-tests.
---

# Writing Integration Tests

**Environments:** locally, the storefront runs at `http://localhost:5180`, Admin at `http://localhost:5174` and the backend at `http://localhost:8081` (the ports the Playwright configs use). On a deployed build, Admin is at `/backoffice`. **Accounts:** register a customer with a new unique email. Log in to Admin locally as `admin` / `admin123`.

**Seeded bugs:** the code contains deliberate defects marked `FM-BUG-NN` and `FM-FLAKE-NN`. Expected results describe the intended behaviour, not what the marked code does. Report a failure as a finding with its marker.

**Execution:** write the cases, and run them only if the user asks. Unexecuted cases are **Not Run**. Never mark a case Pass without observing the result, and never invent results or evidence.

**Each case includes:** title, environment, role, preconditions, test data, steps, expected request and response, and the follow-up read that confirms the result.

1. **Analyze the integration:** Review requirements, identify interacting components, data flow, and expected behavior. Check API contracts in Swagger, controllers, and DTOs. Clarify ambiguous requirements before writing tests.

2. **Design test cases:** Use descriptive names specifying the interaction and expected outcome. Include environment, user role, preconditions, exact test data, and reproducible steps. Use browser DevTools to inspect frontend requests.

3. **Verify successful interactions:** Check request payloads, response status codes, and relevant response fields. For state-changing operations, perform a follow-up read to confirm persistence and consistency. Use the same record ID or order number across checks.

4. **Cover failure scenarios:** Test relevant invalid payloads, missing authentication, insufficient permissions, and missing records. Verify expected errors and ensure rejected operations do not cause unintended state changes.

## Checklist

- [ ] Components and data flow are identified.
- [ ] Roles, preconditions, and test data are specified.
- [ ] Request and response expectations are documented.
- [ ] Positive and negative scenarios are covered.
- [ ] State changes are verified through follow-up reads.
- [ ] Test cases are independent and reproducible.
- [ ] Unclear requirements and execution limitations are documented.

## Report

Summarize integrations covered, environment, execution results, defects, and coverage gaps. Include relevant evidence (redacted requests and responses).

**Statuses:**
- **Pass** — Actual result matches expected behavior.
- **Fail** — Actual result differs from expected behavior.
- **Not Run** — Test has not been executed.
- **Blocked** — Required environment, account, or test data is unavailable.
