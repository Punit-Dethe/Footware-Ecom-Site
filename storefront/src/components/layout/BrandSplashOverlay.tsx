"use client";

import { useEffect, useState } from "react";

export function BrandSplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (document.documentElement.dataset.mirzaSplash !== "first") {
      setVisible(false);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timer = window.setTimeout(
      () => {
        document.documentElement.dataset.mirzaSplash = "seen";
        document.documentElement.style.removeProperty("overflow");
        setVisible(false);
      },
      reducedMotion ? 180 : 2350,
    );

    return () => {
      window.clearTimeout(timer);
      if (document.documentElement.dataset.mirzaSplash === "first") {
        document.documentElement.dataset.mirzaSplash = "seen";
      }
      document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="mirza-splash" aria-hidden="true">
      <div className="mirza-splash__signature">
        <span>MIRZA</span>
        <small>FOOTWEAR</small>
      </div>
    </div>
  );
}
