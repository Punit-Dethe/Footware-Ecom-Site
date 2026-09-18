import { expect, test } from "@playwright/test";

test.describe("Cross-Device Motion Policy — Reduced Motion vs Normal Motion", () => {
  test.describe("Normal Mode (prefers-reduced-motion: no-preference)", () => {
    test.use({
      viewport: { width: 1440, height: 900 },
    });

    test.beforeEach(async ({ context, page }) => {
      await context.addInitScript(() => {
        try {
          window.sessionStorage.removeItem("mirza-brand-splash-v1");
        } catch {}
      });
      await page.emulateMedia({ reducedMotion: "no-preference" });
    });

    test("verifies full normal motion lifecycle: splash, Lenis, parallax, footer reveal, and carousel", async ({
      page,
    }) => {
      await page.goto("/us/en");

      // 1. Splash follows full normal lifecycle (~2.4s)
      const splash = page.locator(".mirza-splash");
      const signature = page.locator(".mirza-splash__signature span");
      await expect(splash).toBeVisible();
      await expect(signature).toHaveText("MIRZA");

      // Verify scroll lock during splash
      const overflowLocked = await page.evaluate(
        () => window.getComputedStyle(document.documentElement).overflow,
      );
      expect(overflowLocked).toBe("hidden");

      // Normal splash duration is > 2000ms
      await page.waitForTimeout(1000);
      await expect(splash).toBeVisible();

      // Completes by 3500ms
      await expect(splash).not.toBeVisible({ timeout: 5000 });

      // Scroll lock is released
      const overflowRestored = await page.evaluate(
        () => window.getComputedStyle(document.documentElement).overflow,
      );
      expect(overflowRestored).not.toBe("hidden");

      // 2. Lenis active & real wheel scroll works
      const hasLenis = await page.evaluate(() =>
        document.documentElement.classList.contains("lenis"),
      );
      expect(hasLenis).toBe(true);

      const beforeWheel = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 400);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(beforeWheel);

      // 3. Parallax transform is active and updates while scrolling past category scenes
      const scene1 = page.locator(".folio-three-scene").first();
      await scene1.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const scene2 = page.locator(".folio-three-scene").nth(1);
      await scene2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const transformAfter = await page.evaluate(() => {
        const inner = document.querySelector(".folio-three-scene__image-inner");
        return (inner as HTMLElement)?.style.transform || "";
      });

      // Parallax transform must be active
      expect(transformAfter).toContain("translate3d");

      // 4. Footer reveal is active on supported desktop width
      const footerReveal = page.locator("[data-layout]");
      await expect(footerReveal).toHaveAttribute("data-layout", "reveal");

      const footerLockPos = await page.evaluate(() => {
        const lock = document.querySelector("[class*='footerLock']");
        return lock ? window.getComputedStyle(lock).position : null;
      });
      expect(footerLockPos).toBe("fixed");

      // 5. Ambient carousel moves continuously when scrolled into view
      const scroller = page.locator(".mirza-product-scroll");
      await scroller.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const carouselViewport = scroller.locator("[class*='viewport']").first();
      await expect(carouselViewport).toBeVisible();

      const initialScroll = await carouselViewport.evaluate(
        (el) => el.scrollLeft,
      );
      await page.waitForTimeout(1400);
      const finalScroll = await carouselViewport.evaluate((el) => el.scrollLeft);
      expect(finalScroll).toBeGreaterThan(initialScroll);

      // 6. Restrained transitions are active on buttons/nav
      const navLinkTransition = await page.evaluate(() => {
        const link = document.querySelector(".editorial-header a");
        return link ? window.getComputedStyle(link).transition : "";
      });
      expect(navLinkTransition).not.toBe("none");
    });
  });

  test.describe("Reduced Motion Mode (prefers-reduced-motion: reduce)", () => {
    test.use({
      viewport: { width: 1440, height: 900 },
    });

    test.beforeEach(async ({ context, page }) => {
      await context.addInitScript(() => {
        try {
          window.sessionStorage.removeItem("mirza-brand-splash-v1");
        } catch {}
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    test("verifies intentional calm reduced-motion experience: calm splash, native scroll, static imagery, static footer, static carousel", async ({
      page,
    }) => {
      await page.goto("/us/en");

      // 1. Splash uses intentional calm presentation: visible on load without hydration flash
      const splash = page.locator(".mirza-splash");
      const signature = page.locator(".mirza-splash__signature span");
      await expect(splash).toBeVisible();
      await expect(signature).toHaveText("MIRZA");

      // Signature has no blur/translate animation in reduced motion
      const signatureStyles = await page.evaluate(() => {
        const sig = document.querySelector(".mirza-splash__signature");
        if (!sig) return null;
        const cs = window.getComputedStyle(sig);
        return {
          animation: cs.animation,
          animationName: cs.animationName,
          transform: cs.transform,
          filter: cs.filter,
        };
      });
      expect(signatureStyles?.animationName).toBe("none");
      expect(signatureStyles?.filter).toBe("none");

      // It must NOT flash-and-disappear instantly upon hydration (must still be visible at 400ms)
      await page.waitForTimeout(400);
      await expect(splash).toBeVisible();

      // Calm presentation finishes within ~1500ms (exitDelay: 650ms + unmount: 900ms)
      await expect(splash).not.toBeVisible({ timeout: 2500 });

      // Clean scroll lock release
      const overflowRestored = await page.evaluate(
        () => window.getComputedStyle(document.documentElement).overflow,
      );
      expect(overflowRestored).not.toBe("hidden");

      // 2. Native scrolling works immediately
      const beforeWheel = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 400);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(beforeWheel);

      // 3. Category imagery remains static (no parallax transform, remains none)
      const scene = page.locator(".folio-three-scene").first();
      await scene.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
      await page.waitForTimeout(300);

      const getTransforms = () =>
        page.evaluate(() => {
          const inners = document.querySelectorAll(".folio-three-scene__image-inner");
          return Array.from(inners).map(el => (el as HTMLElement).style.transform);
        });

      const transformsBefore = await getTransforms();
      await page.evaluate(() => {
        window.scrollBy(0, 250);
        window.dispatchEvent(new Event("scroll"));
      });
      await page.waitForTimeout(300);
      const transformsAfter = await getTransforms();

      // Transforms must remain static ("none" or empty)
      const allStatic = transformsAfter.every(
        (t) => !t || t === "none" || t === "translate3d(0, 0px, 0)",
      );
      expect(allStatic).toBe(true);
      expect(transformsAfter).toEqual(transformsBefore);

      // 4. Footer layout is static (no overlap/reveal)
      const footerReveal = page.locator("[data-layout]");
      await expect(footerReveal).toHaveAttribute("data-layout", "static");

      const footerLockPos = await page.evaluate(() => {
        const lock = document.querySelector("[class*='footerLock']");
        return lock ? window.getComputedStyle(lock).position : null;
      });
      expect(footerLockPos).toBe("relative");

      // 5. Ambient carousel does NOT move automatically
      const scroller = page.locator(".mirza-product-scroll");
      await scroller.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const carouselViewport = scroller.locator("[class*='viewport']").first();
      await expect(carouselViewport).toBeVisible();

      const initialScroll = await carouselViewport.evaluate(
        (el) => el.scrollLeft,
      );
      await page.waitForTimeout(1400);
      const finalScroll = await carouselViewport.evaluate((el) => el.scrollLeft);
      expect(finalScroll).toBe(initialScroll);

      // 6. Broad CSS rule is removed: restrained transitions work on navigation/links
      const navLinkTransition = await page.evaluate(() => {
        const link = document.querySelector(".editorial-header a");
        return link ? window.getComputedStyle(link).transition : "";
      });
      expect(navLinkTransition).not.toBe("none");

      // But product card hover scale is cleanly suppressed
      const cardImgTransition = await page.evaluate(() => {
        const cardImg = document.querySelector(".product-card__image img");
        return cardImg ? window.getComputedStyle(cardImg).transition : "";
      });
      expect(cardImgTransition).toBe("none");

      // 7. Page content remains complete and accessible
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".editorial-footer")).toBeVisible();
    });
  });
});
