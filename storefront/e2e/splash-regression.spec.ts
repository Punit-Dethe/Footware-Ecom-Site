import { expect, test } from "@playwright/test";

test.describe("Brand Splash Lifecycle & Regression", () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies/storage for clean isolation
    await context.clearCookies();
  });

  test("A: Clean session - shows splash, locks scroll, completes, restores scroll", async ({
    page,
  }) => {
    // Navigate with a clean session
    await page.goto("/us/en");

    // Splash overlay and wordmark should be visible initially
    const splash = page.locator(".mirza-splash");
    const signature = page.locator(".mirza-splash__signature span");

    await expect(splash).toBeVisible();
    await expect(signature).toHaveText("MIRZA");

    // Verify computed html overflow is locked during splash
    const overflowLocked = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(overflowLocked).toBe("hidden");

    // Wait for splash to complete (2350ms duration + margin)
    await expect(splash).not.toBeVisible({ timeout: 6000 });

    // Verify computed html overflow is restored
    const overflowRestored = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(overflowRestored).not.toBe("hidden");

    // Verify scrolling works
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("B: Normal reload - splash never visible, immediately scrollable, no dead period", async ({
    page,
  }) => {
    // First visit: wait until splash finishes
    await page.goto("/us/en");
    const splash = page.locator(".mirza-splash");
    await expect(splash).not.toBeVisible({ timeout: 6000 });

    // Verify sessionStorage has key
    const seenStorage = await page.evaluate(() =>
      sessionStorage.getItem("mirza-brand-splash-v1"),
    );
    expect(seenStorage).toBe("seen");

    // Reload page
    await page.reload();

    // Splash must NOT be visible at any point on reload
    const splashVisibleAfterReload = await splash.isVisible();
    expect(splashVisibleAfterReload).toBe(false);

    // Page must be scrollable IMMEDIATELY (no dead period, overflow not hidden)
    const computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");

    const bodyOverflow = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow,
    );
    expect(bodyOverflow).not.toBe("hidden");

    // Scroll immediately without waiting 2.35s
    await page.evaluate(() => window.scrollTo(0, 300));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Ensure no dataset="first" survives
    const dataset = await page.evaluate(
      () => document.documentElement.dataset.mirzaSplash,
    );
    expect(dataset).not.toBe("first");
  });

  test("C: Subsequent navigation - splash does not rerun or acquire lock", async ({
    page,
  }) => {
    await page.goto("/us/en");
    const splash = page.locator(".mirza-splash");
    await expect(splash).not.toBeVisible({ timeout: 6000 });

    // Navigate to PLP
    await page.goto("/us/en/products");
    await expect(splash).not.toBeVisible();
    let computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");

    // Navigate to PDP
    const firstProduct = page.locator('a[href*="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 20_000 });
    const productHref = await firstProduct.getAttribute("href");
    await page.goto(productHref!);
    await expect(splash).not.toBeVisible();
    computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");

    // Navigate back to Homepage
    await page.goto("/us/en");
    await expect(splash).not.toBeVisible();
    computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");

    await page.evaluate(() => window.scrollTo(0, 400));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("D: Reload during/near splash completion - no permanent lock survives", async ({
    page,
  }) => {
    await page.goto("/us/en");
    // Reload at ~1.0s into splash
    await page.waitForTimeout(1000);
    await page.reload();

    const splash = page.locator(".mirza-splash");
    await expect(splash).not.toBeVisible({ timeout: 5000 });

    const computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    const bodyOverflow = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");
    expect(bodyOverflow).not.toBe("hidden");

    await page.evaluate(() => window.scrollTo(0, 400));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("E: Reduced motion - splash completes quickly without long lock", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/us/en");

    const splash = page.locator(".mirza-splash");
    // Under reduced motion, should disappear in < 1500ms
    await expect(splash).not.toBeVisible({ timeout: 1500 });

    const computedOverflow = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(computedOverflow).not.toBe("hidden");
  });
});
