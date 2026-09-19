import { chromium } from "@playwright/test";

const BASE_URL = process.env.PERF_TARGET_URL || "https://mirzafootwear.vercel.app";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTrial(browser, trialIndex, isCold = false) {
  console.log(`\n========================================`);
  console.log(`Starting Trial ${trialIndex + 1} (${isCold ? "COLD-ISH" : "WARM"}) on ${BASE_URL}`);
  console.log(`========================================`);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mirza-Perf-Benchmarker/1.0",
  });
  const page = await context.newPage();

  let serverActionTimings = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.headers()["next-action"]) {
      req._perfStart = performance.now();
    }
  });

  page.on("response", (res) => {
    const req = res.request();
    if (req._perfStart) {
      const duration = performance.now() - req._perfStart;
      serverActionTimings.push({
        url: req.url(),
        action: req.headers()["next-action"],
        durationMs: Math.round(duration),
        status: res.status(),
      });
    }
  });

  const results = {};

  try {
    // 1. Navigate to product page
    console.log(`Navigating to /in/en/products/shoe-2026-09-001 ...`);
    const navStart = performance.now();
    await page.goto(`${BASE_URL}/in/en/products/shoe-2026-09-001`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log(`Product page loaded in ${Math.round(performance.now() - navStart)}ms`);

    // Wait for Add to Cart button and client hydration
    const addBtn = page.locator('.pdp-add-button, button:has-text("Add to Cart")').first();
    await addBtn.waitFor({ state: "visible", timeout: 15000 });
    await page.waitForSelector('.pdp-product[data-hydrated="true"]', { timeout: 15000 });

    // 2. Measure Add to Cart
    console.log(`Executing Add to Cart...`);
    serverActionTimings = [];
    const t0_add = performance.now();
    let t_drawer_ack = null;
    let t_item_visible = null;
    let t_count_updated = null;

    const drawerPromise = page.waitForSelector('[role="dialog"]', { timeout: 10000 }).then(() => {
      t_drawer_ack = performance.now();
    }).catch(() => {});

    const itemPromise = page.waitForSelector(".cart-drawer__item", { timeout: 25000 }).then(() => {
      t_item_visible = performance.now();
    }).catch(() => {});

    const countPromise = page.waitForFunction(() => {
      const el = document.querySelector('.cart-drawer__title span, header [data-slot="cart-count"]');
      return el && (el.textContent.includes("1") || el.textContent.includes("item"));
    }, { timeout: 25000 }).then(() => {
      t_count_updated = performance.now();
    }).catch(() => {});

    await addBtn.click();
    await Promise.all([drawerPromise, itemPromise, countPromise]);

    const addActionDuration = serverActionTimings[0]?.durationMs || null;
    results.add = {
      drawerAckMs: t_drawer_ack ? Math.round(t_drawer_ack - t0_add) : null,
      serverActionMs: addActionDuration,
      itemVisibleMs: t_item_visible ? Math.round(t_item_visible - t0_add) : null,
      countUpdatedMs: t_count_updated ? Math.round(t_count_updated - t0_add) : null,
      totalMs: Math.round((t_item_visible || performance.now()) - t0_add),
    };
    console.log(`Add to Cart: Drawer Ack: ${results.add.drawerAckMs}ms | Server Action: ${addActionDuration}ms | Item Visible: ${results.add.itemVisibleMs}ms | Count Updated: ${results.add.countUpdatedMs}ms`);

    await sleep(600);

    // 3. Measure Update Quantity
    console.log(`Executing Update Quantity (+1)...`);
    serverActionTimings = [];
    const incBtn = page.locator('.cart-drawer__item [data-slot="quantity-picker"] button:has(svg.lucide-plus), .cart-drawer__item button[aria-label*="ncrease"]').first();
    await incBtn.waitFor({ state: "visible", timeout: 5000 });

    const t0_update = performance.now();
    await incBtn.click();

    // Wait for quantity input to show "2"
    await page.waitForFunction(() => {
      const input = document.querySelector('.cart-drawer__item [data-slot="quantity-picker"] input');
      return input && input.value === "2";
    }, { timeout: 25000 });
    const t1_update = performance.now();
    const updateActionDuration = serverActionTimings[0]?.durationMs || null;
    results.update = {
      totalMs: Math.round(t1_update - t0_update),
      serverActionMs: updateActionDuration,
    };
    console.log(`Update Quantity: Total ${results.update.totalMs}ms (Server Action: ${updateActionDuration}ms)`);

    await sleep(600);

    // 4. Measure Remove Item
    console.log(`Executing Remove Item...`);
    serverActionTimings = [];
    const removeBtn = page.locator('.cart-drawer__item button[variant="destructive"], .cart-drawer__item button[aria-label*="Remove"], .cart-drawer__item button:has(svg.lucide-trash)').first();
    await removeBtn.waitFor({ state: "visible", timeout: 5000 });

    const t0_remove = performance.now();
    await removeBtn.click();

    // Wait for cart to show empty state
    await page.waitForSelector('.cart-drawer__body:has-text("empty"), .cart-drawer__body:has-text("Your bag is empty")', { timeout: 25000 });
    const t1_remove = performance.now();
    const removeActionDuration = serverActionTimings[0]?.durationMs || null;
    results.remove = {
      totalMs: Math.round(t1_remove - t0_remove),
      serverActionMs: removeActionDuration,
    };
    console.log(`Remove Item: Total ${results.remove.totalMs}ms (Server Action: ${removeActionDuration}ms)`);

    await sleep(600);

    // 5. Re-add item to test Cart -> Checkout and Place Order
    console.log(`Navigating to PDP to add item for checkout benchmark...`);
    await page.goto(`${BASE_URL}/in/en/products/shoe-2026-09-001`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const addBtn2 = page.locator('.pdp-add-button, button:has-text("Add to Cart")').first();
    await addBtn2.waitFor({ state: "visible", timeout: 15000 });
    await addBtn2.click();
    await page.waitForSelector(".cart-drawer__item", { timeout: 25000 });
    await sleep(600);

    // 6. Measure Cart -> Checkout navigation
    console.log(`Navigating Cart -> Checkout...`);
    const checkoutLink = page.locator('.cart-drawer__checkout, a[href*="/checkout/"]').first();
    await checkoutLink.waitFor({ state: "visible", timeout: 5000 });

    const t0_checkoutNav = performance.now();
    await checkoutLink.click();

    await page.waitForURL(/\/checkout\//, { timeout: 25000 });
    await page.waitForSelector('.checkout-form__submit, button:has-text("Pay now"), button:has-text("Place order")', { timeout: 25000 });
    const t1_checkoutNav = performance.now();
    results.cartToCheckout = {
      totalMs: Math.round(t1_checkoutNav - t0_checkoutNav),
    };
    console.log(`Cart -> Checkout: ${results.cartToCheckout.totalMs}ms`);

    await sleep(600);

    // 7. Measure Checkout: Place Order
    console.log(`Filling checkout form and placing order...`);
    const emailInput = page.locator('input#email, input[type="email"]').first();
    await emailInput.fill(`perf-${Date.now()}@example.com`);
    await emailInput.blur();
    await sleep(300);

    // Fill shipping address
    const firstName = page.locator('input#ship-first_name, input[name*="first"]').first();
    if (await firstName.count() > 0) await firstName.fill("Perf");
    const lastName = page.locator('input#ship-last_name, input[name*="last"]').first();
    if (await lastName.count() > 0) await lastName.fill("Tester");

    const address1 = page.locator('input#ship-address1, input[name*="address1"]').first();
    if (await address1.count() > 0) await address1.fill("100 Marine Drive");
    const city = page.locator('input#ship-city, input[name="city"]').first();
    if (await city.count() > 0) await city.fill("Mumbai");
    const postal = page.locator('input#ship-postal_code, input[name*="postal"]').first();
    if (await postal.count() > 0) await postal.fill("400001");
    const phone = page.locator('input#ship-phone, input[name="phone"]').first();
    if (await phone.count() > 0) {
      await phone.fill("+919876543210");
      await phone.blur();
    }

    await sleep(500);

    // Policy consent
    const consent = page.locator('#policy-consent').first();
    if (await consent.count() > 0) {
      const state = await consent.getAttribute("data-state");
      if (state !== "checked") {
        await consent.click();
      }
    }

    await sleep(500);

    // Click Place Order / Pay now
    const submitBtn = page.locator('.checkout-form__submit, button:has-text("Pay now"), button:has-text("Place order")').first();
    await submitBtn.waitFor({ state: "visible", timeout: 5000 });

    serverActionTimings = [];
    const t0_placeOrder = performance.now();
    await submitBtn.click();

    // Wait for order-placed confirmation URL
    await page.waitForURL(/\/order-placed\//, { timeout: 35000 });
    await page.waitForSelector(':has-text("MRZ-"), :has-text("Confirmed"), :has-text("Thank you")', { timeout: 25000 });
    const t1_placeOrder = performance.now();
    results.placeOrder = {
      totalMs: Math.round(t1_placeOrder - t0_placeOrder),
    };
    console.log(`Place Order: ${results.placeOrder.totalMs}ms`);

  } catch (err) {
    console.error(`Trial ${trialIndex + 1} failed:`, err.message);
    results.error = err.message;
  } finally {
    await context.close();
  }

  return results;
}

async function main() {
  console.log(`Launching browser for benchmark against ${BASE_URL} ...`);
  const browser = await chromium.launch({ headless: true });

  const trials = [];

  // Run Trial 0 to verify end-to-end
  const coldResult = await runTrial(browser, 0, true);
  trials.push(coldResult);

  // Warm trials 1 to 5
  for (let i = 1; i <= 5; i++) {
    await sleep(1000);
    const warmResult = await runTrial(browser, i, false);
    trials.push(warmResult);
  }

  await browser.close();

  console.log("\n========================================");
  console.log("BENCHMARK SUMMARY (HOSTED BASELINE)");
  console.log("========================================");

  function getMetricStats(key) {
    const values = trials
      .slice(1) // warm only
      .map((t) => t[key]?.totalMs)
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);

    if (values.length === 0) return { median: "N/A", worst: "N/A", all: [] };
    const median = values[Math.floor(values.length / 2)];
    const worst = values[values.length - 1];
    return { median, worst, all: values };
  }

  function getSubMetricStats(key, subKey) {
    const values = trials
      .slice(1) // warm only
      .map((t) => t[key]?.[subKey])
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);

    if (values.length === 0) return { median: "N/A", worst: "N/A", all: [] };
    const median = values[Math.floor(values.length / 2)];
    const worst = values[values.length - 1];
    return { median, worst, all: values };
  }

  const addStats = getMetricStats("add");
  const addDrawerAck = getSubMetricStats("add", "drawerAckMs");
  const addServerAction = getSubMetricStats("add", "serverActionMs");
  const addItemVisible = getSubMetricStats("add", "itemVisibleMs");
  const addCountUpdated = getSubMetricStats("add", "countUpdatedMs");

  const updateStats = getMetricStats("update");
  const removeStats = getMetricStats("remove");
  const checkoutStats = getMetricStats("cartToCheckout");
  const orderStats = getMetricStats("placeOrder");

  console.log(`Add to Cart (warm visible median): ${addStats.median}ms, worst: ${addStats.worst}ms`);
  console.log(`  - Drawer Ack median: ${addDrawerAck.median}ms, worst: ${addDrawerAck.worst}ms`);
  console.log(`  - Server Action median: ${addServerAction.median}ms, worst: ${addServerAction.worst}ms`);
  console.log(`  - Item Visible median: ${addItemVisible.median}ms, worst: ${addItemVisible.worst}ms`);
  console.log(`  - Count Updated median: ${addCountUpdated.median}ms, worst: ${addCountUpdated.worst}ms`);
  console.log(`Update Quantity (warm median): ${updateStats.median}ms, worst: ${updateStats.worst}ms`);
  console.log(`Remove Item (warm median): ${removeStats.median}ms, worst: ${removeStats.worst}ms`);
  console.log(`Cart -> Checkout (warm median): ${checkoutStats.median}ms, worst: ${checkoutStats.worst}ms`);
  console.log(`Place Order (warm median): ${orderStats.median}ms, worst: ${orderStats.worst}ms`);

  console.log(`\nAll trials:\n`, JSON.stringify(trials, null, 2));
}

main().catch(console.error);
