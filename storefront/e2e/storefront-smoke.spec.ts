import { expect, test } from "@playwright/test";

/**
 * Storefront First-Party Smoke E2E.
 *
 * Verifies that the first-party Next.js storefront routes render cleanly:
 * 1. Homepage renders brand navigation and key sections.
 * 2. Product Listing Page (PLP) renders catalog items.
 * 3. Product Detail Page (PDP) displays product metadata and purchase controls.
 *
 * Runs against the local Next.js dev or preview server without requiring
 * any legacy Rails/Spree backend or external payment container.
 */

test.describe("Storefront First-Party Smoke Suite", () => {
  test("homepage renders and navigates to catalog", async ({ page }) => {
    await page.goto("/us/en");
    await expect(page).toHaveTitle(/Footwear|Store|Mirza/i);

    // Header/Brand navigation is present
    const mainNav = page.getByRole("navigation");
    await expect(mainNav.first()).toBeVisible({ timeout: 15_000 });

    // Navigate to products catalog
    await page.goto("/us/en/products");
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("product detail page renders product details and purchase button", async ({
    page,
  }) => {
    await page.goto("/us/en/products");
    const firstProduct = page.locator('a[href*="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 20_000 });

    // Open first product
    await firstProduct.click();
    await page.waitForURL(/\/products\/[^/]+/, { timeout: 15_000 });

    // Add to cart button is present on the PDP
    const addToCartButton = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible({ timeout: 15_000 });
  });
});
