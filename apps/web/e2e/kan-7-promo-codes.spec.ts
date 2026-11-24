import { test, expect, type Page } from "@playwright/test";
import { createAccountAtCheckout } from "./auth";

// KAN-7: apply a promo code at checkout.
// Cases and expected values: agentic-workflows/functional-testing/runs/KAN-7/spec.yaml
// Shared setup: chef Alans Kitchen (/chef/24), delivery 500 AMD, free from 5,000 AMD,
// DELIVERY at checkout, total = subtotal - discount + delivery (Q-1).

const CHEF = "/chef/24";
const CURRY = "Chicken curry rice & vegetables"; // 3,000 AMD
const YASSAI = "Yassai curry"; // 2,900 AMD
const KATSU = "Chicken Katsu Curry"; // 3,150 AMD
const SALMON = "Salmon Maki"; // 2,000 AMD
const OSHINKO = "Oshinko Maki"; // 1,500 AMD

type CartLine = [name: string, qty: number];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Adds a dish through its dish dialog, with no additions selected. */
async function addDish(page: Page, name: string, qty: number) {
  await page
    .getByRole("button", { name: new RegExp(`^${escapeRe(name)} [\\d,]+ AMD`) })
    .click();
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  for (let i = 1; i < qty; i++) {
    await dialog.getByRole("button", { name: "Increase quantity" }).click();
  }
  await expect(dialog.getByText(String(qty), { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(dialog).toBeHidden();
}

/** Opens Alans Kitchen, fills the cart, signs up at checkout and chooses DELIVERY. */
async function checkoutWith(page: Page, cart: CartLine[]) {
  await page.goto(CHEF);
  for (const [name, qty] of cart) await addDish(page, name, qty);
  await page.goto("/checkout");
  await createAccountAtCheckout(page, "Kan Seven");
  const delivery = page.getByRole("button", { name: /^Delivery/ });
  await delivery.click();
  await expect(delivery).toHaveAttribute("aria-pressed", "true");
  return page.getByRole("complementary");
}

function promoField(page: Page) {
  return page.getByRole("textbox", { name: "Promo code", exact: true });
}

/** Types a code and presses Apply, waiting for the promo request to finish. */
async function applyCode(page: Page, code: string) {
  await promoField(page).fill(code);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/customer/promo/apply")),
    page.getByRole("button", { name: "Apply", exact: true }).click(),
  ]);
}

// The summary's text runs label and value together ("Total3,200 AMD"), so rows are matched by regex.
const total = (amount: string) => new RegExp(`Total\\s*${escapeRe(amount)} AMD`);
const discount = (amount: string) =>
  new RegExp(`Discount.*?[−-]\\s?${escapeRe(amount)} AMD`);

test.describe("KAN-7 promo code at checkout", () => {
  test("KAN-7-TC-01: SAVE10 at exactly the 3,000 AMD minimum is applied with a 300 AMD discount", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);
    await expect(promoField(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeVisible();

    await applyCode(page, "SAVE10");

    await expect(summary).toContainText(discount("300"));
    await expect(summary).toContainText(total("3,200"));
  });

  test("KAN-7-TC-02: SAVE10 with a 2,900 AMD subtotal is rejected with the missing amount", async ({ page }) => {
    const summary = await checkoutWith(page, [[YASSAI, 1]]);

    await applyCode(page, "SAVE10");

    await expect(page.getByText("Add 100 AMD more to use this code", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("3,400"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-03: TREAT15 at exactly the 8,000 AMD minimum is applied with a 1,200 AMD discount", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 2], [SALMON, 1]]);

    await applyCode(page, "TREAT15");

    await expect(summary).toContainText(discount("1,200"));
    await expect(summary).toContainText(total("6,800"));
  });

  test("KAN-7-TC-04: TREAT15 with a 7,900 AMD subtotal is rejected with the missing amount", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1], [YASSAI, 1], [SALMON, 1]]);

    await applyCode(page, "TREAT15");

    await expect(page.getByText("Add 100 AMD more to use this code", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("7,900"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-05: TREAT15 on an 8,150 AMD subtotal keeps the fractional discount 1,222.5 AMD", async ({ page }) => {
    const summary = await checkoutWith(page, [[KATSU, 1], [CURRY, 1], [SALMON, 1]]);

    await applyCode(page, "TREAT15");

    await expect(summary).toContainText(discount("1,222.5"));
    await expect(summary).toContainText(total("6,927.5"));
  });

  test("KAN-7-TC-06: Expired code OLD15 is rejected as expired", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);

    await applyCode(page, "OLD15");

    await expect(page.getByText("This code has expired", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("3,500"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-07: Unknown code NOPE99 is rejected as not found", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);

    await applyCode(page, "NOPE99");

    await expect(page.getByText("Code not found", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("3,500"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-08: SAVE10 with surrounding spaces is trimmed and applied", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);

    await applyCode(page, " SAVE10 ");

    await expect(summary).toContainText(discount("300"));
    await expect(summary).toContainText(total("3,200"));
  });

  test("KAN-7-TC-09: Lowercase save10 is rejected as not found (matching is case-sensitive)", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);

    await applyCode(page, "save10");

    await expect(page.getByText("Code not found", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("3,500"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-10: Apply is disabled while the promo code field is empty", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);

    await promoField(page).fill("");

    await expect(page.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
    await expect(summary).toContainText(total("3,500"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-11: Applying TREAT15 after SAVE10 replaces the first code", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 2], [SALMON, 1]]);

    await applyCode(page, "SAVE10");
    await applyCode(page, "TREAT15");

    await expect(summary).toContainText(discount("1,200"));
    await expect(summary).toContainText(total("6,800"));
    await expect(summary).not.toContainText(discount("800"));
    await expect(summary.getByText(/Discount/)).toHaveCount(1);
  });

  test("KAN-7-TC-12: Applying expired OLD15 after SAVE10 removes SAVE10 and shows the error", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 2], [SALMON, 1]]);

    await applyCode(page, "SAVE10");
    await applyCode(page, "OLD15");

    await expect(page.getByText("This code has expired", { exact: true })).toBeVisible();
    await expect(summary).toContainText(total("8,000"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-13: Removing an applied SAVE10 returns the total to the original", async ({ page }) => {
    const summary = await checkoutWith(page, [[CURRY, 1]]);
    await expect(summary).toContainText(total("3,500"));

    await applyCode(page, "SAVE10");
    const remove = page.getByRole("button", { name: "Remove promo code" });
    await remove.click();

    await expect(remove).toBeHidden();
    await expect(summary).toContainText(total("3,500"));
    await expect(summary).not.toContainText("Discount");
  });

  test("KAN-7-TC-14: SAVE10 stays applied and is recomputed when the cart drops below the minimum", async ({ page }) => {
    await checkoutWith(page, [[CURRY, 1], [OSHINKO, 1]]);

    await applyCode(page, "SAVE10");

    // The checkout has no cart controls: remove the dish from the chef page's order panel.
    await page.goto(CHEF);
    const orderPanel = page.getByRole("complementary");
    const curryLine = orderPanel.getByText(CURRY, { exact: true });
    await curryLine.locator("..").getByRole("button", { name: "Remove item" }).click();
    await expect(curryLine).toBeHidden();
    await page.goto("/checkout");

    const summary = page.getByRole("complementary");
    await expect(summary).toContainText(discount("150"));
    await expect(summary).toContainText(total("1,850"));
  });
});
