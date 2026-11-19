---
name: foodme-integration-tests
description: Write or fix FoodMe integration tests. Covers the backend from HTTP through security, service and JPA to H2 (MockMvc), storefront pages with real providers against MSW, and the admin dataProvider through axios to MSW. Use for API, auth/role, persistence or page-level tests. Not for unit tests or Playwright e2e. For manual test cases, use manual-integration-tests.
argument-hint: "[endpoint, flow or page]"
---

# FoodMe integration tests

Target: `$ARGUMENTS`. If it's empty, ask what to cover. Run real layers together and fake only the outer boundary: nothing on the backend, HTTP via MSW on the frontends.

## Rules
- **Seeded bugs (`FM-BUG`/`FM-FLAKE`).** Assert the intended behavior. Report failures as findings with the marker. Don't fix them in passing.
- **Questionable documented behavior.** For example, `/admin/**` accepts any role. Flag it and ask which behavior to assert.
- **Off-limits.** Never test the heartbeat jobs or `/api/debug/boom`. Never use sleeps. Never commit or push, because a push redeploys on Render.
- **Determinism.**
  - No `@Order`.
  - Use unique data, such as UUID emails.
  - Count only rows you created, never global totals.
  - Don't modify seed rows, or restore them in `@AfterEach`.
  - Assert order numbers by format (`FM-\d{6}`), never by value.
  - Assert list order only when the query defines it.
  - Assert times within a before/after window with an explicit timezone.

## Workflow
1. Name the seam and the risk.
2. Read every layer involved, plus `data.sql` or the backend DTOs.
3. Test through the outermost entry point. Assert the response, then read the side effect back through a different path.
4. Run the test. Break the wiring and confirm it fails, then revert.
5. Report what's covered, the commands you ran, findings and gaps.

## Backend (`apps/backend`, JDK 17)
- **Run and name.** Run `./gradlew test --tests '*IntegrationTest'`. Name files `<Feature>IntegrationTest`.
- **Header.** Use only `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")` on every class.
  - No `@MockBean` or `@DirtiesContext`. Each one creates a new context that can re-seed the shared H2 database.
  - No `@Transactional`. Rollback hides lazy-loading and commit errors.
- **Tokens.** For a customer, register a UUID email at `/api/auth/register`. For an admin, log in at `/admin/auth/login` as `admin` / `admin123`.
- **Cover:**
  - **Security matrix.** Callers: none, customer, admin, tampered token. Expect 401 for unauthenticated and 403 for the wrong role.
  - **Validation.** Test `@Size` boundaries. Expect 400 with `$.message`, never 500.
  - **Round trip.** Create an order, then read it back with `GET /api/order/number/{n}`.
  - **Atomicity.** A request that fails partway saves nothing.
  - **Admin status transitions.** Valid ones succeed. Invalid ones return 400.
  - **Search with hostile input.** Try `'`, `%`, `' OR '1'='1`. Expect 200 and a correct `count`.
  - **Pagination edges.**
  - **Image URLs.** `ImageUrlResponseAdvice` makes `/api/images/` URLs absolute.
  - **Unknown paths.** An unknown `/api` path returns a JSON 404.
- **Limit.** H2 never runs Flyway, so state in the report that migrations are untested.

## Storefront (`apps/web`) — a new layer, so ask before adding it
- **Install.** `npm i -D vitest jsdom fake-indexeddb msw @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- **Config.** Merge `vite.config.ts`. Use `environment: "jsdom"` and include only `src/**/*.test.{ts,tsx}`.
- **Setup file.**
  - Import `fake-indexeddb/auto` and `@/lib/i18n`.
  - Start MSW with `server.listen({ onUnhandledFrame: "error" })`. That's the MSW 3 name for the option.
  - After each test, reset handlers and clear localStorage.
- **Render helper.** Use a fresh `QueryClient` with `retry: false`, wrap in `AuthProvider`, and use `createMemoryRouter`.
- **Writing tests.**
  - Mock only HTTP, with `*/api/...` handlers, never `apiClient`.
  - Shape fixtures like the backend DTOs.
  - Assert the UI, the request that was sent, `router.state.location`, and stored auth and cart state.
- **Gotcha.** jsdom's native `type="email"` check runs before zod, so test zod rules through other fields.
- **After.** `npm run build` and `npm run lint` must still pass.

## Admin (`apps/admin`)
- **Install.** `npm i -D vitest jsdom msw`
- **Config.** Merge `viteConfig({ mode: 'test' })`. Set `environmentOptions: { jsdom: { url: 'http://localhost:8081' } }`, or axios sends a CORS preflight that MSW won't answer.
- **Test** the path `dataProvider` → `base-api.js` → HTTP:
  - `/admin` prefix
  - Bearer token
  - 0-based paging
  - `{list, count}` → `{data, total}`
  - 401 clears the token
- **Skip** react-admin screens. Playwright covers them.