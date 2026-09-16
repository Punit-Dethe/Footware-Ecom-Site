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
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const timer = window.setTimeout(
      () => {
        setVisible(false);
        document.documentElement.style.overflow = previousOverflow;
        delete document.documentElement.dataset.mirzaSplash;
      },
      reducedMotion ? 180 : 2350,
    );

    return () => {
      window.clearTimeout(timer);
      document.documentElement.style.overflow = previousOverflow;
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
