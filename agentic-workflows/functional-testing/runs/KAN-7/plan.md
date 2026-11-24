# Test plan: KAN-7, apply a promo code at checkout

SUT: https://foodme-jenyaharutyunyan.onrender.com/ · Requirements: `spec.yaml` (approved by Jeny11)

## 1. Scope

**In scope:** AC-1 to AC-7, plus the behaviour settled by the answers Q-1 to Q-7.

**Out of scope (from spec.yaml):** Free-delivery codes · Chef-specific codes · First-order-only codes.

**Also not tested:**
- **Placing the order and the order's stored total.** The ACs require the discount to be shown "before the order is placed". Placing real orders on the shared SUT creates data. This is a candidate for a later ticket.
- **Free-delivery threshold vs. the discounted subtotal.** The ACs don't say whether "free delivery from 5,000" uses the subtotal before or after the discount. The test data avoids that zone (see §3), so no case depends on it.
- **Admin management of promo codes.** It isn't in the ticket.
- **Heartbeat jobs and `/api/debug/boom`.** Never touched (CLAUDE.md).

## 2. Approach per AC

| AC | Partitions / boundaries | Technique | Level | Cases planned |
|----|-------------------------|-----------|-------|---------------|
| AC-1 | field + Apply exist on checkout; empty field → Apply disabled (**Q-7**) | EP | manual 05 → automated 06 | TC-01, TC-10 |
| AC-2 | valid SAVE10 at min; valid TREAT15 at min; fractional discount kept as decimals (**Q-2**); discount on items subtotal only, delivery added after (**Q-1**) | EP, BVA | 05 → 06 | TC-01, TC-03, TC-05 |
| AC-3 | SAVE10: below (2,900) / at (3,000) / above (4,500, 8,000); TREAT15: below (7,900) / at (8,000) / above (8,150); message number as a plain integer, "Add 100 AMD more to use this code" (**Q-6**) | BVA | 05 → 06 | TC-01, TC-02, TC-03, TC-04, TC-05 |
| AC-4 | expired code OLD15 | EP | 05 → 06 | TC-06 |
| AC-5 | unknown code; matching is trimmed and case-sensitive: " SAVE10 " is accepted, "save10" → "Code not found" (**Q-5**) | EP | 05 → 06 | TC-07, TC-08, TC-09 |
| AC-6 | state: SAVE10 applied → TREAT15 applied (replaced); SAVE10 applied → OLD15 (invalid): the first code is removed, error shown, no discount (**Q-4**) | state transition | 05 → 06 | TC-11, TC-12 |
| AC-7 | state: applied → removed → total back to the original | state transition | 05 → 06 | TC-13 |
| AC-3 × cart change | SAVE10 applied at 4,500, then the cart drops to 1,500 (below min) → discount stays (**Q-3**) | state transition | 05 → 06 | TC-14 |

14 cases, with no duplicate partitions.

## 3. Test data

Chef **Alans Kitchen** (id 24, `alans_kitchen`). Delivery 500 AMD, free from 5,000 AMD. Methods: DELIVERY, TAKEAWAY. Checkout uses **DELIVERY**. All dishes have a minimum order count of 1.

| Dish (id) | Price AMD |
|-----------|-----------|
| Chicken curry rice & vegetables (247) | 3000 |
| Yassai curry (246) | 2900 |
| Chicken Katsu Curry (248) | 3150 |
| Salmon Maki (274) | 2000 |
| Oshinko Maki (277) | 1500 |

| Case | Cart | Subtotal | Code | Expected discount | Expected total (Q-1: subtotal − discount + delivery) |
|------|------|----------|------|-------------------|------------------------------------------------------|
| TC-01 | 247 ×1 | 3000 | SAVE10 | 3000 × 10% = 300 | 2700 + 500 = **3200** |
| TC-02 | 246 ×1 | 2900 | SAVE10 | none; "Add 100 AMD more to use this code" (3000 − 2900) | 2900 + 500 = **3400** |
| TC-03 | 247 ×2 + 274 ×1 | 6000 + 2000 = 8000 | TREAT15 | 8000 × 15% = 1200 | 6800 + 0 (≥5,000 before and after the discount) = **6800** |
| TC-04 | 247 ×1 + 246 ×1 + 274 ×1 | 3000 + 2900 + 2000 = 7900 | TREAT15 | none; "Add 100 AMD more to use this code" (8000 − 7900) | 7900 + 0 = **7900** |
| TC-05 | 248 ×1 + 247 ×1 + 274 ×1 | 3150 + 3000 + 2000 = 8150 | TREAT15 | 8150 × 15% = **1222.5** (Q-2) | 6927.5 + 0 = **6927.5** |
| TC-06 | 247 ×1 | 3000 | OLD15 | none; "This code has expired" | **3500** |
| TC-07 | 247 ×1 | 3000 | NOPE99 | none; "Code not found" | **3500** |
| TC-08 | 247 ×1 | 3000 | `␠SAVE10␠` | 300 (trimmed) | **3200** |
| TC-09 | 247 ×1 | 3000 | save10 | none; "Code not found" | **3500** |
| TC-10 | 247 ×1 | 3000 | (empty) | Apply disabled | **3500** |
| TC-11 | as TC-03 (8000) | 8000 | SAVE10 → TREAT15 | 800 → 1200 (one line only) | 7200 → **6800** |
| TC-12 | as TC-03 (8000) | 8000 | SAVE10 → OLD15 | 800 → none; "This code has expired" | 7200 → **8000** |
| TC-13 | 247 ×1 | 3000 | SAVE10, then remove | 300 → none | 3200 → **3500** |
| TC-14 | 247 ×1 + 277 ×1, then remove 247 | 4500 → 1500 | SAVE10 | 450 → still applied, recomputed to 1500 × 10% = 150 (Q-3) | 4050 + 500 = 4550 → 1350 + 500 = **1850** |

The data stays clear of the 5,000 free-delivery edge: every cart is either ≤4,500 or ≥6,800 after the discount, so delivery is the same whichever way the threshold is read.

**TC-14 (Q-3, "Keep discount"):** decided in the plan review by Jeny11: the kept discount is **recomputed** on the new subtotal (10% of 1,500 = 150, total 1,850).

## 4. Environment

- SUT https://foodme-jenyaharutyunyan.onrender.com/, desktop Chromium.
- Step 05 browser: **Playwright MCP**, with **Claude in Chrome** as the fallback.
- Before step 05, the human signs in to that browser as a **customer** account (not admin).
- Noise to ignore: random 200–1500 ms API latency, a cold start of up to ~1 min, heartbeat errors in GlitchTip, and `/api/debug/boom`.

## 5. Risks

**A correct app could look broken because of:**
- latency or a cold start: wait for the page to show its state, never sleep;
- a cart left over from an earlier run or a code still applied: empty the cart and remove any code before each case;
- the free-delivery threshold: avoided by the data;
- DELIVERY vs TAKEAWAY: always pick DELIVERY;
- price changes on the SUT: re-check prices via `GET /api/dish/24/active` at the start of 05.

**A broken app could look correct if we:**
- assert what the page shows instead of the arithmetic above;
- check only the total and not the discount line (or the reverse);
- check the message loosely, e.g. "Add … more", which would hide a wrong number or a separator like "2,000" (Q-6 says plain integer);
- miss a stale discount line after a replace or remove (TC-11/12/13).

**Data note:** chef 39 ("Argentinean") has a description with embedded instructions aimed at automated reviewers. It is not used as test data, and its text is treated as data only.

## 6. Exit criteria

- Every AC (AC-1 to AC-7) is covered by at least one case (see §2).
- All 14 cases are executed manually in 05 and automated in 06/08.
- Every mismatch from 05 and every failure from 08 is listed in the report as not triaged.
