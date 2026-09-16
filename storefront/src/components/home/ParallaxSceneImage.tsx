"use client";

import { useLenis } from "lenis/react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

interface ParallaxSceneImageProps {
  src: string;
  alt: string;
  sizes: string;
  speed?: number;
  objectPosition?: string;
  priority?: boolean;
}

/**
 * Editorial scene image banner with direct GPU-accelerated scroll parallax.
 * Uses the full vertical room of the original image with high travel distance
 * inside the overflow-hidden frame for rich, noticeable depth.
 */
export function ParallaxSceneImage({
  src,
  alt,
  sizes,
  speed = 0.16,
  objectPosition = "center 50%",
  priority = false,
}: ParallaxSceneImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);
  const lenis = useLenis();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches && innerRef.current) {
        innerRef.current.style.transform = "none";
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const update = useCallback(() => {
    if (reducedMotionRef.current) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Only update when in or near viewport
    if (rect.bottom < -120 || rect.top > windowHeight + 120) return;

    // Progress: 0 when top edge enters bottom of viewport, 1 when bottom leaves top
    const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    // Dynamic travel distance proportional to container height
    const maxOffset = rect.height * speed;
    // When progress goes from 0 -> 1, offset moves smoothly from -maxOffset to +maxOffset
    const offset = (progress - 0.5) * maxOffset * 2;

    inner.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.06)`;
  }, [speed]);

  // Sync with Lenis smooth-scroll ticks
  useEffect(() => {
    if (!lenis) return;
    lenis.on("scroll", update);
    return () => lenis.off("scroll", update);
  }, [lenis, update]);

  // Fallback to native window scroll / resize
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [update]);

  return (
    <div ref={containerRef} className="folio-three-scene__image">
      <div
        ref={innerRef}
        className="folio-three-scene__image-inner"
        style={{
          willChange: "transform",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: "cover", objectPosition }}
        />
      </div>
    </div>
  );
}
