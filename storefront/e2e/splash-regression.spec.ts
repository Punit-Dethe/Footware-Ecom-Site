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

    // Wait for splash to complete (2400ms duration + margin)
    await expect(splash).not.toBeVisible({ timeout: 6000 });

    // Verify computed html overflow is restored
    const overflowRestored = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).overflow,
    );
    expect(overflowRestored).not.toBe("hidden");

    // Verify wheel scrolling after splash completion on first visit
    const beforeFirst = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(beforeFirst);
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

    // Ensure no dataset="first" survives
    const dataset = await page.evaluate(
      () => document.documentElement.dataset.mirzaSplash,
    );
    expect(dataset).not.toBe("first");

    // Ensure content is ready
    await expect(page.locator("h1")).toBeVisible();

    // Real user-scroll regression: verify wheel scroll occurs immediately with native scrolling authority
    const before = await page.evaluate(() => window.scrollY);
    const scrollStartTime = Date.now();
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 2000 })
      .toBeGreaterThan(before);
    const scrollElapsed = Date.now() - scrollStartTime;
    // With native scrolling, wheel responds immediately without the old ~400-500ms Lenis freeze
    expect(scrollElapsed).toBeLessThan(1000);
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

  test("F: Native scrolling authority - immediate wheel responsiveness, anchor jump, and touch scroll", async ({
    page,
  }) => {
    // Prime session so splash does not run
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });
    await page.goto("/us/en");
    await expect(page.locator("h1")).toBeVisible();

    // 1. Wheel scroll responds immediately without Lenis interception
    const before = await page.evaluate(() => window.scrollY);
    const scrollStart = Date.now();
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 1500 })
      .toBeGreaterThan(before);
    const scrollElapsed = Date.now() - scrollStart;
    expect(scrollElapsed).toBeLessThan(800);

    // 2. Same-page anchor jump to #craft works natively
    const craftAnchor = page.locator("header a[href*='#craft']").first();
    if ((await craftAnchor.count()) > 0) {
      await craftAnchor.click();
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(500);
    }

    // 3. Native touch scroll / instant scroll works
    const beforeTouch = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => {
      window.scrollBy({ top: 200, behavior: "instant" });
    });
    const afterTouch = await page.evaluate(() => window.scrollY);
    expect(afterTouch).toBeGreaterThan(beforeTouch);
  });
});
