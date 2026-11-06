---
name: regression
description: Run targeted or full FoodMe regression testing for code changes, branches, bug fixes, and releases. Select affected test suites, execute tests, classify failures, verify fixes, and report results. Use when checking whether changes introduced regressions. Not for designing tests for new features.
---

# FoodMe Release Regression

## 1. Choose the Scope

Run a **full** regression for a release. Run a **targeted** one for a change, branch or bug fix, and include:

| Changed | Run |
|---|---|
| `apps/backend` | Backend suite, plus Web and Admin if an API contract changed |
| `apps/web` | Web suite |
| `apps/admin` | Admin suite |

Always run the smoke test. For a bug fix, also repeat the original reproduction steps. State in the report what was left out.

## 2. Release Preparation
- Record build/commit, environment, included tickets, and test accounts.
- Verify environment health using `/actuator/health`.

## 3. Smoke Test
Verify the critical end-to-end journey first:
- Explore chefs, open a chef, add two dishes, and verify cart total.
- Register or log in as a customer.
- Complete delivery checkout and record the order number.
- Log in to Admin (`/backoffice`), find the same order, and change its status.

If the smoke test fails, stop and report **No Go**, unless the only cause is a known `FM-BUG` issue accepted for this release. In that case, record it and continue.

## 4. Release Coverage

For a full regression, verify each area at least once. For a targeted one, verify only the areas in scope:

- **Storefront:** Home, explore, chef page, dish modal, cart, delivery/takeaway checkout, payment methods, success/failure pages, tracking, registration, login, order history, mobile view.
- **Admin:** Login, invalid credentials, orders list/details, status changes, chefs and dishes lists/editing, sidebar navigation.
- **API:** Swagger (`/swagger-ui.html`), unauthorized access (401), image endpoints (`/api/images/**`).

Use release-ticket regression cases for deeper testing of changed functionality.

## 5. Automated Tests

Run suites separately. The Backend suite uses in-memory H2 and needs no running services. The Web and Admin suites start their own dev servers on ports `5180` and `5174`, and need the backend on port `8081` with PostgreSQL running:

- Backend: `cd apps/backend && ./gradlew test`
- Web: `cd apps/web && npm run test:e2e`
- Admin: `cd apps/admin && npm run test:e2e`

Do not use `npm run test:e2e:all`; it may skip Admin tests after Web failures.

Rerun failing tests with an `FM-FLAKE-NN` marker before classifying results: `apps/web/e2e/flake-*.spec.ts`, plus the marked tests in `DishControllerTest` and `OrderControllerTest`. Treat heartbeat errors in GlitchTip as intentional demo noise and report seeded `FM-BUG-NN` issues separately from new regressions.

## 6. Checklist

- [ ] Release build, environment, tickets, and accounts documented.
- [ ] Smoke journey completed and the same order verified in both interfaces.
- [ ] Storefront, Admin, and API coverage completed.
- [ ] Backend, Web, and Admin suites executed separately.
- [ ] Flaky failures rerun and seeded bugs identified.
- [ ] New regressions and coverage gaps documented.

## 7. Final Report

Provide a release verdict:

- **Go** — No blocking issues found.
- **Go with known issues** — Only accepted known issues remain.
- **No Go** — New blocking regressions, or critical smoke tests failed for a reason not accepted as a known issue.

Include build/environment, covered areas, commands and results, new regressions (reproduction steps, expected vs. actual results, evidence), known `FM-BUG` issues, and untested areas.

**Test statuses:**
- **Pass** — Actual result matches expected.
- **Fail** — Actual differs; identify new regression or known bug.
- **Not Run** — Planned but not executed.
- **Blocked** — Required environment, account, or test data unavailable.
