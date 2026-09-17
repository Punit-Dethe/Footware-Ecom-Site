"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";

const options: LenisOptions = {
  autoRaf: true,
  lerp: 0.09,
  smoothWheel: true,
  respectReducedMotion: true,
  syncTouch: false,
  wheelMultiplier: 0.9,
  stopInertiaOnNavigate: true,
};

export function SmoothScroll() {
  return <ReactLenis options={options} root />;
}
