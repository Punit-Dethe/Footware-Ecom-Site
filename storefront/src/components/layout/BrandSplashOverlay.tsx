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

    if (reducedMotion) {
      document.documentElement.dataset.mirzaSplash = "seen";
      setVisible(false);
      return;
    }

    // Single authoritative lifecycle timer
    const exitTimer = window.setTimeout(() => {
      // Release scroll lock immediately at dismissal start
      document.documentElement.dataset.mirzaSplash = "seen";
      setExiting(true);
    }, 2050);

    const unmountTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2400);

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
