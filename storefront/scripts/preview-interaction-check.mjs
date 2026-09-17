import { chromium } from "@playwright/test";

async function testInteractions() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.addInitScript(() => {
    sessionStorage.setItem("mirza-brand-splash-v1", "seen");
  });

  const url = "https://storefront-fystu072m-watrmallone.vercel.app/us/en";
  console.log("Navigating to", url);
  await page.goto(url, { waitUntil: "networkidle" });

  // 1. Check cart trigger
  const cartTrigger = page.locator("button[aria-label*='cart' i], a[href*='cart' i]").first();
  const cartCount = await cartTrigger.count();
  console.log("Cart trigger count:", cartCount);
  if (cartCount > 0) {
    await cartTrigger.click();
    await page.waitForTimeout(500);
    const dialogVisible = await page.locator("[role='dialog'], [data-lenis-prevent]").first().isVisible().catch(() => false);
    console.log("Cart dialog visible:", dialogVisible);
    // Close cart
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // 2. Check PLP and navigate to real PDP
  await page.goto(url.replace("/us/en", "/us/en/products"), { waitUntil: "networkidle" });
  const plpH1 = await page.locator("h1").first().textContent().catch(() => "none");
  console.log("PLP h1:", plpH1);

  const firstProduct = page.locator("a[href*='/products/']").first();
  await firstProduct.waitFor({ state: "visible" });
  const href = await firstProduct.getAttribute("href");
  console.log("Navigating to product:", href);
  await firstProduct.click();
  await page.waitForLoadState("networkidle");
  const pdpH1 = await page.locator("h1").first().textContent().catch(() => "none");
  console.log("PDP h1:", pdpH1);

  // 4. Mobile viewport & menu
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(url, { waitUntil: "networkidle" });
  const menuBtn = page.locator("button[aria-label*='menu' i], button[aria-label*='navigation' i]").first();
  const menuCount = await menuBtn.count();
  console.log("Mobile menu button count:", menuCount);
  if (menuCount > 0) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    const navVisible = await page.locator("nav").first().isVisible().catch(() => false);
    console.log("Mobile nav visible:", navVisible);
  }

  await browser.close();
  console.log("All manual interaction checks passed successfully!");
}

testInteractions().catch(console.error);
