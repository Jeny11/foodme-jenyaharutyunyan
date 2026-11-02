import { test, expect } from "@playwright/test";

// Regression for FM-BUG-07 / KAN-5: "−" must lower quantity by one and only
// remove the item when pressed at the dish's minimum quantity.
test.describe("Cart decrement (FM-BUG-07)", () => {
  test("− lowers quantity by one and removes only at the minimum", async ({ page }) => {
    await page.goto("/explore");
    await page.locator("a.cc_card").first().click();
    await expect(page).toHaveURL(/\/chef\/\d+/);
    await page.locator("button.dc_card").first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    const cart = page.locator("aside.uc-panel");
    const item = cart.locator(".cic_root");
    const qty = cart.locator(".fm-qty-grp p");
    const increase = cart.getByRole("button", { name: "Increase quantity" });
    const decrease = cart.getByRole("button", { name: "Decrease quantity" });

    await expect(item).toHaveCount(1);
    // A freshly added item starts at the dish's minimum quantity.
    const min = Number(await qty.textContent());
    expect(min).toBeGreaterThanOrEqual(1);

    await increase.click();
    await expect(qty).toHaveText(String(min + 1));

    // min + 1 -> min: item must stay in the cart (this step failed under FM-BUG-07).
    await decrease.click();
    await expect(qty).toHaveText(String(min));
    await expect(item).toHaveCount(1);

    // At the minimum, "−" removes the item.
    await decrease.click();
    await expect(item).toHaveCount(0);
    await expect(cart.getByText(/empty/i)).toBeVisible();
  });
});
