---
name: foodme-storefront-test-cases
description: Write manual test cases for the FoodMe user storefront (customer web app at /): home, explore, chef menu, dish modal, cart, auth, checkout, order status, orders, tracking. Not for admin backoffice.
---
## Before writing
1. Confirm which module(s) to cover and the output format. If neither is given, cover the whole module as a Markdown table.
2. Read the source for that module. Don't rely on memory.

## Workflow
1. Write the cases, covering every applicable area under Coverage.
2. Run the final check.

## Template

| Field | What to write |
|---|---|
| ID | `SF-<MODULE>-<NNN>`, unique, e.g. `SF-CART-001`. Modules: `HDR`, `HOME`, `EXP`, `CHEF`, `DISH`, `CART`, `AUTH`, `CHK`, `OST`, `ORD`, `TRK`, `XC` |
| Title | `<action/condition> → <outcome>`, ≤ 90 chars |
| Type | Positive, Negative, Boundary, State, Error, Integration or Security |
| Priority | See below |
| Precondition | A specific condition, e.g. `Cart has 2 items`, |
| Test data | Exact values |
| Steps | Numbered, one action each, start from a URL, controls by visible label: `Click "Place order"` |
| Expected result | The intended behaviour from requirements or documentation |

## Priority
- **High:** blocks ordering or sign-in, affects money or totals, or exposes data.
- **Medium:** a core feature fails for some users or has a workaround.
- **Low:** a non-core feature, copy, layout or cosmetic issue.

## Writing rules
- One behaviour per case. A toggle round-trip may be one case.
- Expected results quote exact UI text and values, and describe the intended behaviour, not what the code happens to do. The code contains seeded defects marked `FM-BUG-NN`; if it disagrees with the requirements, use the requirements and flag the difference.
- Steps are reproducible by someone new to the app: no implied steps, no "etc."
- Use real data from the running app (dish names, prices). Never invent values.
- Mark cases that need DevTools (blocked requests, replayed API calls, storage edits) as Type: Integration or Security, and give the exact tool step.

## Coverage — apply to every module
- **Positive:** main flow with valid data.
- **Negative:** each validation rule broken one at a time; invalid IDs and URLs; actions in the wrong auth state.
- **Boundary:** min−1 / min / max / max+1 for every length and quantity limit; values around price thresholds; page-size edges.
- **Equivalence classes:** e.g. email format, case and spacing; empty vs whitespace-only.
- **State transitions:** cart (empty → items → another chef), auth (signed out ↔ in), delivery method switch, order status lifecycle.
- **Error handling:** each API failure shows its specific message and retry recovers; slow network shows loading states; double submit is prevented.
- **Persistence:** reload, new tab, two tabs, cleared storage (cart in IndexedDB, auth in localStorage).
- **Navigation:** deep links, unknown routes, browser Back after submit, redirects with `next`.
- **Consistency:** the same value (counts, totals, delivery fee) matches across cart, checkout, tracking and orders.

## Output
- **Default:** Markdown table per module (ID | Title | Type | Priority | Preconditions | Test data | Steps | Expected), then a coverage summary: counts by type and priority, and the coverage areas applied.
- **Spreadsheet / TestRail / Jira import:** `.xlsx` or `.csv`, one row per case, with all template fields.
- **Smoke/sanity checklist:** one line per check, with ID and priority.

## Final check
- [ ] Storefront only; admin actions appear only as preconditions
- [ ] Every requested module has positive, negative, boundary and state cases
- [ ] Every expected result is observable and matches the requirements; any difference from the code is flagged
- [ ] Preconditions and test data are concrete
- [ ] IDs are unique, priorities follow the rules, one behaviour per case