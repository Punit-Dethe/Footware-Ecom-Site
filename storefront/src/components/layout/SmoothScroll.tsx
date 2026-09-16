"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";

const options: LenisOptions = {
  anchors: false,
  autoRaf: false,
  lerp: 0.09,
  respectReducedMotion: true,
  smoothWheel: true,
  stopInertiaOnNavigate: true,
  syncTouch: false,
  wheelMultiplier: 0.9,
};

/**
 * Drives Lenis only while motion is active. This retains the same interpolation
 * without keeping a requestAnimationFrame loop alive while the page is idle.
 */
function ActiveScrollRaf() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    let animationFrame = 0;

    const update = (time: number) => {
      lenis.raf(time);

      if (lenis.isScrolling) {
        animationFrame = window.requestAnimationFrame(update);
      } else {
        animationFrame = 0;
      }
    };

    const start = () => {
      if (!animationFrame) {
        // The RAF pauses while idle. Rebase Lenis' clock before restarting so
        // the first frame cannot absorb the entire idle interval and jump.
        lenis.time = performance.now();
        animationFrame = window.requestAnimationFrame(update);
      }
    };

    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event
        .composedPath()
        .find(
          (node): node is HTMLAnchorElement =>
            node instanceof HTMLAnchorElement,
        );
      if (
        !anchor?.hash ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const targetUrl = new URL(anchor.href);
      const currentUrl = new URL(window.location.href);
      if (
        targetUrl.origin !== currentUrl.origin ||
        targetUrl.pathname !== currentUrl.pathname ||
        targetUrl.search !== currentUrl.search
      ) {
        return;
      }

      let target: string;
      try {
        target = decodeURIComponent(targetUrl.hash);
      } catch {
        return;
      }
      if (target !== "#" && !document.getElementById(target.slice(1))) return;

      event.preventDefault();
      window.history.pushState(null, "", targetUrl);
      lenis.scrollTo(target);
      start();
    };

    const stopListeningToWheel = lenis.on("virtual-scroll", start);
    window.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      stopListeningToWheel();
      window.removeEventListener("click", handleAnchorClick, { capture: true });
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [lenis]);

  return null;
}

/** Smooths wheel input while preserving native touch and reduced-motion behavior. */
export function SmoothScroll() {
  return (
    <ReactLenis options={options} root>
      <ActiveScrollRaf />
    </ReactLenis>
  );
}
