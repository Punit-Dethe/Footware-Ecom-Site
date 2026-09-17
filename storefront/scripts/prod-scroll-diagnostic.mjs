import { chromium } from "@playwright/test";

async function testTarget(targetName, url) {
  console.log(`\n############################################################`);
  console.log(`TESTING TARGET: ${targetName} (${url})`);
  console.log(`############################################################`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // Install instrumentation init script on every document creation
  await page.addInitScript(() => {
    // Ensure session storage seen state
    sessionStorage.setItem("mirza-brand-splash-v1", "seen");

    const samples = [];
    const wheelEvents = [];
    window.__scrollSamples = samples;
    window.__wheelEvents = wheelEvents;

    const captureWheel = (e) => {
      wheelEvents.push({
        time: performance.now(),
        defaultPrevented: e.defaultPrevented,
        deltaY: e.deltaY,
        phase: e.eventPhase,
        target: e.target ? (e.target.tagName + (e.target.className ? '.' + e.target.className : '')) : null,
      });
    };

    window.addEventListener("wheel", captureWheel, { capture: true, passive: false });
    window.addEventListener("wheel", captureWheel, { capture: false, passive: false });

    const sample = () => {
      try {
        const html = document.documentElement;
        const body = document.body;
        const htmlComputed = html ? window.getComputedStyle(html) : null;
        const bodyComputed = body ? window.getComputedStyle(body) : null;

        samples.push({
          time: performance.now(),
          readyState: document.readyState,
          scrollY: window.scrollY || 0,
          mirzaSplash: html?.dataset?.mirzaSplash || null,
          htmlOverflow: htmlComputed?.overflow || null,
          htmlOverflowY: htmlComputed?.overflowY || null,
          bodyOverflow: bodyComputed?.overflow || null,
          bodyOverflowY: bodyComputed?.overflowY || null,
          htmlClass: html?.className || "",
          bodyClass: body?.className || "",
          hasLenis: html?.classList?.contains("lenis") || false,
          hasLenisSmooth: html?.classList?.contains("lenis-smooth") || false,
          hasLenisStopped: html?.classList?.contains("lenis-stopped") || false,
          wheelCount: wheelEvents.length,
          lastWheelPrevented: wheelEvents.length ? wheelEvents[wheelEvents.length - 1].defaultPrevented : null,
        });
      } catch (err) {
        samples.push({ error: err.message, time: performance.now() });
      }
    };

    sample();
    const interval = setInterval(sample, 50);
    setTimeout(() => clearInterval(interval), 5000);
  });

  console.log(`Navigating to ${targetName} for session priming...`);
  await page.goto(url, { waitUntil: "networkidle" });
  console.log("Primed session storage.");

  const results = [];

  for (let run = 1; run <= 5; run++) {
    console.log(`\n--- Run ${run} ---`);
    
    // Ensure we start at scrollY = 0 before reloading and disable browser scroll restoration
    await page.evaluate(() => {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(200);

    // Trigger reload
    await page.reload({ waitUntil: "domcontentloaded" });

    // Center mouse to ensure wheel hits viewport main area
    await page.mouse.move(640, 400);

    let firstScrollTime = null;
    let initialScrollY = await page.evaluate(() => window.scrollY);

    // Attempt wheel scrolls every 50ms up to 4500ms
    const startWheelTime = Date.now();
    while (Date.now() - startWheelTime < 4500) {
      await page.mouse.wheel(0, 300);
      const currentScrollY = await page.evaluate(() => window.scrollY);
      if (currentScrollY > initialScrollY && firstScrollTime === null) {
        firstScrollTime = Date.now() - startWheelTime;
        console.log(`>>> First scroll observed at ${firstScrollTime}ms! scrollY = ${currentScrollY}`);
        break;
      }
      await page.waitForTimeout(50);
    }

    if (firstScrollTime === null) {
      console.log(`>>> NO SCROLL OBSERVED within 4500ms!`);
    }

    // Wait remaining of sample window
    await page.waitForTimeout(800);

    // Fetch instrumentation data
    const data = await page.evaluate(() => {
      return {
        samples: window.__scrollSamples || [],
        wheelEvents: window.__wheelEvents || [],
      };
    });

    results.push({
      run,
      firstScrollTime,
      samples: data.samples,
      wheelEvents: data.wheelEvents,
    });
  }

  await browser.close();

  const scrollTimes = results.map(r => r.firstScrollTime).filter(t => t !== null);
  scrollTimes.sort((a, b) => a - b);
  const median = scrollTimes.length ? (scrollTimes.length % 2 === 0 ? (scrollTimes[scrollTimes.length/2 - 1] + scrollTimes[scrollTimes.length/2]) / 2 : scrollTimes[Math.floor(scrollTimes.length/2)]) : null;
  const max = scrollTimes.length ? scrollTimes[scrollTimes.length - 1] : null;

  console.log(`\n================ ${targetName} SUMMARY ================`);
  console.log(`Run times: ${results.map(r => r.firstScrollTime + 'ms').join(', ')}`);
  console.log(`Median scroll delay: ${median}ms`);
  console.log(`Max scroll delay: ${max}ms`);

  // Sample during freeze (e.g. at ~150-300ms of Run 1)
  const run1FreezeSamples = results[0].samples.filter(s => s.time >= 100 && s.time <= 400);
  console.log(`\nSamples during freeze interval (Run 1, 100ms-400ms):`);
  for (const s of run1FreezeSamples) {
    console.log(
      `[${Math.round(s.time)}ms] ready:${s.readyState} scrollY:${s.scrollY} splash:${s.mirzaSplash} htmlOver:${s.htmlOverflow} bodyOver:${s.bodyOverflow} htmlClass:'${s.htmlClass}' lenis:${s.hasLenis} wheels:${s.wheelCount} defPrev:${s.lastWheelPrevented}`
    );
  }

  return {
    targetName,
    results,
    scrollTimes,
    median,
    max,
    sampleFreeze: run1FreezeSamples[0] || null,
  };
}

async function main() {
  const prod = await testTarget("CURRENT PRODUCTION (custom ActiveScrollRaf)", "https://mirzafootwear.vercel.app/us/en");
  const noLenis = await testTarget("NO-LENIS BASELINE (native scroll authority)", "https://storefront-3k4cveyqe-watrmallone.vercel.app/us/en");
  const autoRaf = await testTarget("PREVIEW (autoRaf: true Lenis)", "https://storefront-fystu072m-watrmallone.vercel.app/us/en");

  console.log("\n\n############################################################");
  console.log("FINAL COMPARATIVE A/B REPORT");
  console.log("############################################################");
  console.log(`CURRENT PRODUCTION (custom ActiveScrollRaf):`);
  console.log(`  Runs: ${prod.results.map(r => r.firstScrollTime + 'ms').join(', ')}`);
  console.log(`  Median: ${prod.median}ms`);
  console.log(`  Max: ${prod.max}ms`);

  console.log(`\nNO-LENIS BASELINE (native scroll):`);
  console.log(`  Runs: ${noLenis.results.map(r => r.firstScrollTime + 'ms').join(', ')}`);
  console.log(`  Median: ${noLenis.median}ms`);
  console.log(`  Max: ${noLenis.max}ms`);

  console.log(`\nPREVIEW (autoRaf: true Lenis):`);
  console.log(`  Runs: ${autoRaf.results.map(r => r.firstScrollTime + 'ms').join(', ')}`);
  console.log(`  Median: ${autoRaf.median}ms`);
  console.log(`  Max: ${autoRaf.max}ms`);
}

main().catch(console.error);
