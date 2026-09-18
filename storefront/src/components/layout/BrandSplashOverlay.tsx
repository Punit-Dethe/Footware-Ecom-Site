"use client";

import { useEffect, useState } from "react";

export function BrandSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.mirzaSplash !== "first") {
      setVisible(false);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Normal: 2050ms exit / 2400ms unmount
    // Reduced motion: 650ms presentation / 900ms unmount (calm, intentional, no hydration flash)
    const exitDelay = reducedMotion ? 650 : 2050;
    const unmountDelay = reducedMotion ? 900 : 2400;

    // Single authoritative lifecycle timer
    const exitTimer = window.setTimeout(() => {
      // Release scroll lock immediately at dismissal start
      document.documentElement.dataset.mirzaSplash = "seen";
      setExiting(true);
    }, exitDelay);

    const unmountTimer = window.setTimeout(() => {
      setVisible(false);
    }, unmountDelay);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(unmountTimer);
      if (document.documentElement.dataset.mirzaSplash === "first") {
        document.documentElement.dataset.mirzaSplash = "seen";
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`mirza-splash${exiting ? " mirza-splash--exiting" : ""}`}
      aria-hidden="true"
    >
      <div className="mirza-splash__signature">
        <span>MIRZA</span>
        <small>FOOTWEAR</small>
      </div>
    </div>
  );
}
