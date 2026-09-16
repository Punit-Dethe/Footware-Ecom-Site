"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";
import styles from "./FooterReveal.module.css";

const FOOTER_START_OFFSET = 0.48;

interface FooterRevealProps {
  children: ReactNode;
}

/**
 * Keeps the existing footer behind the page so the page's real final section
 * uncovers it while the footer rises into place. The spacer tracks the rendered
 * footer height; no transition panel or duplicate content is introduced.
 */
export function FooterReveal({ children }: FooterRevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);
  const footerLockRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reveal = revealRef.current;
    const footerLock = footerLockRef.current;
    if (!reveal || !footerLock) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactLayout = window.matchMedia("(max-width: 47.5rem)");
    let animationFrame = 0;
    let footerHeight = Math.max(footerLock.offsetHeight, 1);
    let isIntersecting = false;

    const setAvailability = (visible: boolean) => {
      if (reveal.dataset.layout === "static") return;
      footerLock.inert = !visible;
      footerLock.toggleAttribute("aria-hidden", !visible);
      reveal.dataset.visible = String(visible);
    };

    const updatePosition = () => {
      animationFrame = 0;

      if (reveal.dataset.layout !== "reveal") {
        reveal.style.removeProperty("--footer-reveal-shift");
        return;
      }

      const bounds = reveal.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight - bounds.top) / footerHeight),
      );

      reveal.style.setProperty(
        "--footer-reveal-shift",
        `${(1 - progress) * FOOTER_START_OFFSET * footerHeight}px`,
      );
    };

    const scheduleUpdate = () => {
      if (
        animationFrame ||
        !isIntersecting ||
        reveal.dataset.layout !== "reveal"
      ) {
        return;
      }
      animationFrame = window.requestAnimationFrame(updatePosition);
    };

    const syncLayout = () => {
      const staticLayout = reducedMotion.matches || compactLayout.matches;
      reveal.dataset.layout = staticLayout ? "static" : "reveal";

      if (staticLayout) {
        reveal.style.removeProperty("--footer-reveal-height");
        reveal.dataset.visible = "true";
        footerLock.inert = false;
        footerLock.removeAttribute("aria-hidden");
        updatePosition();
        return;
      }

      footerHeight = Math.max(footerLock.offsetHeight, 1);
      reveal.style.setProperty("--footer-reveal-height", `${footerHeight}px`);
      const bounds = reveal.getBoundingClientRect();
      isIntersecting = bounds.bottom > 0 && bounds.top < window.innerHeight;
      setAvailability(isIntersecting);
      updatePosition();
    };

    const resizeObserver = new ResizeObserver(syncLayout);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        setAvailability(isIntersecting);
        scheduleUpdate();
      },
      { threshold: 0 },
    );

    syncLayout();
    resizeObserver.observe(footerLock);
    intersectionObserver.observe(reveal);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", syncLayout);
    compactLayout.addEventListener("change", syncLayout);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", syncLayout);
      compactLayout.removeEventListener("change", syncLayout);
      footerLock.inert = false;
    };
  }, []);

  return (
    <div className={styles.reveal} ref={revealRef}>
      <div className={styles.footerLock} ref={footerLockRef}>
        {children}
      </div>
    </div>
  );
}
