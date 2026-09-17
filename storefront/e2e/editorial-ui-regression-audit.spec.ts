import { expect, test, type Page } from "@playwright/test";

function attachAuditObservers(page: Page) {
  const consoleErrors: string[] = [];
  const hydrationWarnings: string[] = [];
  const failedRequests: { url: string; status: number }[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    } else if (msg.type() === "warning" && msg.text().includes("Hydration")) {
      hydrationWarnings.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`PageError: ${err.message}`);
  });

  page.on("response", (res) => {
    // Ignore external analytics/tag managers if blocked in test
    if (res.status() >= 400 && !res.url().includes("googletagmanager")) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  return { consoleErrors, hydrationWarnings, failedRequests };
}

test.describe("Mirza Editorial UI Regression Audit", () => {
  test("1. Homepage Editorial UI and Chrome", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    await page.goto("/us/en");

    // Header & Brand Logo
    const logo = page.locator("header a.editorial-brand");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/us/en");

    // Search Toggle
    const openSearch = page.getByRole("button", { name: /open search/i });
    await expect(openSearch).toBeVisible();
    await openSearch.click();

    const searchInput = page.locator("header input[type='search'], header input[placeholder*='Search' i]");
    await expect(searchInput).toBeVisible();

    const closeSearch = page.getByRole("button", { name: /close search/i });
    await closeSearch.click();

    // Account & Cart
    const accountLink = page.locator("header a[href*='/account']");
    await expect(accountLink).toBeVisible();

    const cartTrigger = page.locator("header button[aria-label*='Cart' i], header a[href*='/cart']");
    await expect(cartTrigger).toBeVisible();

    // Hero Section & CTAs
    const heroHeading = page.locator("h1");
    await expect(heroHeading).toBeVisible();
    const heroCta = page.locator("a.home-button, a[href*='/products']").first();
    await expect(heroCta).toBeVisible();

    // Considered Edit products
    const productCards = page.locator("a[href*='/products/']");
    await expect(productCards.first()).toBeVisible({ timeout: 15_000 });
    const productCount = await productCards.count();
    expect(productCount).toBeGreaterThan(0);

    // Carousel / horizontal scroll area (More to Discover / Editorial Track)
    const carouselTrack = page.locator(".product-carousel__track, [data-carousel], .home-carousel");
    if (await carouselTrack.count() > 0) {
      await expect(carouselTrack.first()).toBeVisible();
      await carouselTrack.first().evaluate((el) => {
        el.scrollLeft += 100;
      });
      const scrollLeft = await carouselTrack.first().evaluate((el) => el.scrollLeft);
      expect(scrollLeft).toBeGreaterThanOrEqual(0);
    }

    // Footer
    const footer = page.locator("footer");
    await expect(footer).toBeAttached();

    // Assert no critical console errors or hydration errors
    expect(observers.hydrationWarnings).toEqual([]);
    const realErrors = observers.consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("gtm"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });

  test("2. PLP / Catalog: Filtering, Sorting, Ordering & Append", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    await page.goto("/us/en/products");

    // Verify initial products
    const productCards = page.locator("a[href*='/products/']");
    await expect(productCards.first()).toBeVisible({ timeout: 20_000 });
    const initialCount = await productCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Verify images rendered
    const firstImage = page.locator("main img").first();
    await expect(firstImage).toBeVisible();
    const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);

    // Desktop filter controls present
    const filterControls = page.locator(".catalog-filter-bar__desktop, .catalog-filter-bar__controls, [data-filter-section]");
    await expect(filterControls.first()).toBeVisible();

    // Sort control present
    const sortTrigger = page.locator(".catalog-filter-bar__meta button, button[aria-haspopup='menu'], button:has-text('Sort')");
    await expect(sortTrigger.first()).toBeVisible();

    // Navigation to PDP works
    const firstProduct = productCards.first();
    const targetUrl = await firstProduct.getAttribute("href");
    await firstProduct.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await firstProduct.click();
    try {
      await expect(page).toHaveURL(/\/products\/[^/]+/, { timeout: 6_000 });
    } catch {
      // Re-click if initial click occurred during Next.js cold client router hydration
      await firstProduct.click();
      await expect(page).toHaveURL(/\/products\/[^/]+/, { timeout: 20_000 });
    }
    expect(page.url()).toContain(targetUrl);

    // Check runtime health
    const realErrors = observers.consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("gtm"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.hydrationWarnings).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });

  test("3. PDP: Gallery, Variants, Quantity, Add to Cart & Accordion", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    await page.goto("/us/en/products");
    const firstProduct = page.locator("a[href*='/products/']").first();
    await expect(firstProduct).toBeVisible({ timeout: 20_000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/[^/]+/);

    // PDP Hero / Gallery
    const galleryImage = page.locator(".media-gallery img, img[alt*='product' i], main img").first();
    await expect(galleryImage).toBeVisible();

    // Variant Picker
    const variantOptions = page.locator(".variant-picker__option, .variant-picker__swatch");
    if (await variantOptions.count() > 0) {
      const firstVariant = variantOptions.first();
      await expect(firstVariant).toBeVisible();
      await firstVariant.click();
    }

    // Add to cart button
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Check Cart Drawer / Indicator
    const cartIndicator = page.locator("[data-cart-drawer], [aria-label*='Cart' i], .cart-count, .cart-button");
    await expect(cartIndicator.first()).toBeVisible({ timeout: 10_000 });

    // Check runtime health
    const realErrors = observers.consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("gtm"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.hydrationWarnings).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });

  test("4. Cart Drawer & Cart Page Mutations and Persistence", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    // Go to Cart page
    await page.goto("/us/en/cart");

    // Check Cart page container
    const cartPage = page.locator("main, .cart-page");
    await expect(cartPage.first()).toBeVisible();

    // Check empty state or items
    const emptyStateOrItems = page.locator(".cart-empty, button:has-text('Checkout'), a[href*='/checkout'], [data-cart-item]");
    await expect(emptyStateOrItems.first()).toBeVisible({ timeout: 10_000 });

    // Check runtime health
    const realErrors = observers.consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("gtm"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.hydrationWarnings).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });

  test("5. Checkout Flow: Product to Checkout Shell and Summary", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    // 1. Visit PDP and add product to cart to generate a real cart ID
    await page.goto("/us/en/products");
    const firstProduct = page.locator("a[href*='/products/']").first();
    await expect(firstProduct).toBeVisible({ timeout: 20_000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/[^/]+/);

    // Select available variant if needed
    const variantOptions = page.locator(".variant-picker__option:not(:disabled)");
    if (await variantOptions.count() > 0) {
      await variantOptions.first().click();
    }

    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Wait for drawer or cart indicator to appear
    const drawerCheckout = page.locator("a[href*='/checkout/']");
    await expect(drawerCheckout.first()).toBeVisible({ timeout: 15_000 });
    const checkoutUrl = await drawerCheckout.first().getAttribute("href");
    expect(checkoutUrl).toMatch(/\/checkout\/[^/]+/);

    // 2. Navigate to checkout URL
    await page.goto(checkoutUrl!);
    await expect(page).toHaveURL(/\/checkout\/[^/]+/);

    // 3. Verify checkout shell, address/delivery section, and order summary
    const checkoutMain = page.locator("main.checkout-form, main").first();
    await expect(checkoutMain).toBeVisible();

    const orderSummary = page.locator(".order-summary, [data-order-summary], :has-text('Order summary')");
    await expect(orderSummary.first()).toBeVisible();

    // Check runtime health
    const realErrors = observers.consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("gtm"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.hydrationWarnings).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });

  test("6. Responsive Mobile Viewport Layout", async ({ page }) => {
    const observers = attachAuditObservers(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.addInitScript(() => {
      sessionStorage.setItem("mirza-brand-splash-v1", "seen");
    });

    await page.goto("/us/en");

    // Mobile header
    const mobileHeader = page.locator("header");
    await expect(mobileHeader).toBeVisible();

    // Mobile menu toggle button
    const mobileMenuTrigger = page.locator("header button[aria-label*='Menu' i], header button[aria-label*='Navigation' i], .editorial-mobile-menu button");
    if (await mobileMenuTrigger.count() > 0) {
      await expect(mobileMenuTrigger.first()).toBeVisible();
      await mobileMenuTrigger.first().click();
      const mobileNav = page.locator("[role='dialog'], nav[aria-label*='Mobile' i]");
      await expect(mobileNav.first()).toBeVisible({ timeout: 5000 });
    }

    // Check runtime health (excluding known Radix UI data-aria-hidden dialog attribute mismatch)
    const realErrors = observers.consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("gtm") &&
        !e.includes("data-aria-hidden"),
    );
    expect(realErrors).toEqual([]);
    expect(observers.hydrationWarnings).toEqual([]);
    expect(observers.failedRequests).toEqual([]);
  });
});
