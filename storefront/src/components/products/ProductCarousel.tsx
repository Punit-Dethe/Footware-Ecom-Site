"use client";

import { useTranslations } from "next-intl";
import {
  type PointerEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/commerce";

interface ProductCarouselProps {
  products: Product[];
  basePath: string;
  currency?: string;
  ariaLabel?: string;
  listId?: string;
  listName?: string;
  priorityFirst?: boolean;
  ambientMotion?: boolean;
}

interface DragState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startScrollLeft: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
}

interface MotionState {
  direction: -1 | 1;
  velocity: number;
  pauseUntil: number;
  lastFrame: number;
  lastWheelTime: number;
  residualDistance: number;
}

const AMBIENT_SPEED = 0.04;
const MAX_RELEASE_SPEED = 0.82;
const INERTIA_SETTLE_MS = 900;

function clampVelocity(value: number) {
  return Math.max(-MAX_RELEASE_SPEED, Math.min(MAX_RELEASE_SPEED, value));
}

export function ProductCarousel({
  products,
  basePath,
  currency,
  ariaLabel,
  listId = "featured-products",
  listName = "Featured Products",
  priorityFirst = true,
  ambientMotion = false,
}: ProductCarouselProps) {
  const t = useTranslations("products");
  const tHome = useTranslations("home");
  const viewportRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const lastPointerInteractionRef = useRef(0);
  const motionRef = useRef<MotionState>({
    direction: 1,
    velocity: ambientMotion ? AMBIENT_SPEED : 0,
    pauseUntil: 0,
    lastFrame: 0,
    lastWheelTime: 0,
    residualDistance: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  // A complete set must be wider than the viewport, including small catalogs.
  const cycle = useMemo(() => {
    if (products.length === 0) return [];
    return Array.from(
      { length: Math.max(products.length, 6) },
      (_, index) => products[index % products.length],
    );
  }, [products]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || cycle.length === 0) return;

    let cycleWidth = 0;
    const measure = () => {
      const items = viewport.children;
      const first = items[0] as HTMLElement | undefined;
      const nextCycle = items[cycle.length] as HTMLElement | undefined;
      if (!first || !nextCycle) return;

      const nextWidth = nextCycle.offsetLeft - first.offsetLeft;
      if (nextWidth <= 0) return;
      const relativePosition = cycleWidth
        ? (viewport.scrollLeft - cycleWidth) / cycleWidth
        : 0;
      cycleWidth = nextWidth;
      viewport.scrollLeft = cycleWidth * (1 + relativePosition);
    };

    const wrap = () => {
      if (!cycleWidth) return;
      let shift = 0;
      if (viewport.scrollLeft < cycleWidth / 2) shift = cycleWidth;
      if (viewport.scrollLeft > cycleWidth * 1.5) shift = -cycleWidth;
      if (!shift) return;
      viewport.scrollLeft += shift;
      if (dragRef.current) dragRef.current.startScrollLeft += shift;
    };

    measure();
    viewport.addEventListener("scroll", wrap, { passive: true });
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      viewport.removeEventListener("scroll", wrap);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cycle.length]);

  useLayoutEffect(() => {
    if (!ambientMotion) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const motion = motionRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isVisible = typeof IntersectionObserver === "undefined";
    let hasFocusWithin = viewport.contains(document.activeElement);
    let animationFrame = 0;

    motion.velocity = reducedMotion.matches
      ? 0
      : motion.direction * AMBIENT_SPEED;
    motion.lastFrame = 0;

    const shouldAnimate = () =>
      isVisible &&
      !document.hidden &&
      !reducedMotion.matches &&
      !hasFocusWithin;

    const stopAnimation = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      motion.lastFrame = 0;
    };

    const animate = (time: number) => {
      animationFrame = 0;
      if (!shouldAnimate()) return;

      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      const minInterval = isMobile ? 33 : 14;
      if (motion.lastFrame && time - motion.lastFrame < minInterval) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      const elapsed = motion.lastFrame
        ? Math.min(Math.max(time - motion.lastFrame, 0), 40)
        : 16;
      motion.lastFrame = time;

      if (!dragRef.current && time >= motion.pauseUntil) {
        const targetVelocity = motion.direction * AMBIENT_SPEED;
        const easing = 1 - Math.exp(-elapsed / INERTIA_SETTLE_MS);
        motion.velocity += (targetVelocity - motion.velocity) * easing;
        const distance = motion.residualDistance + motion.velocity * elapsed;
        const wholePixels = Math.trunc(distance);
        motion.residualDistance = distance - wholePixels;
        if (wholePixels) viewport.scrollLeft += wholePixels;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };


    const startAnimation = () => {
      if (animationFrame || !shouldAnimate()) return;
      motion.lastFrame = 0;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const onFocusIn = () => {
      const arrivedFromKeyboard =
        performance.now() - lastPointerInteractionRef.current > 120;
      hasFocusWithin = arrivedFromKeyboard;
      if (arrivedFromKeyboard) {
        motion.velocity = 0;
        stopAnimation();
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      hasFocusWithin = viewport.contains(event.relatedTarget as Node | null);
      startAnimation();
    };
    const onMotionPreferenceChange = () => {
      motion.velocity = reducedMotion.matches
        ? 0
        : motion.direction * AMBIENT_SPEED;
      if (reducedMotion.matches) stopAnimation();
      else startAnimation();
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              isVisible = entry?.isIntersecting ?? true;
              if (isVisible) startAnimation();
              else stopAnimation();
            },
            { threshold: 0.04 },
          );

    observer?.observe(viewport);
    viewport.addEventListener("focusin", onFocusIn);
    viewport.addEventListener("focusout", onFocusOut);
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    startAnimation();

    return () => {
      stopAnimation();
      observer?.disconnect();
      viewport.removeEventListener("focusin", onFocusIn);
      viewport.removeEventListener("focusout", onFocusOut);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [ambientMotion]);

  const updateGestureVelocity = (velocity: number) => {
    if (!ambientMotion || !Number.isFinite(velocity)) return;
    const motion = motionRef.current;
    const nextVelocity = clampVelocity(velocity);
    if (Math.abs(nextVelocity) > AMBIENT_SPEED * 1.5) {
      motion.direction = nextVelocity < 0 ? -1 : 1;
    }
    motion.velocity = nextVelocity;
  };

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    if (!ambientMotion) return;
    const horizontalDelta =
      Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.55
        ? event.deltaX
        : event.shiftKey
          ? event.deltaY
          : 0;
    if (Math.abs(horizontalDelta) < 0.5) return;

    const now = performance.now();
    const motion = motionRef.current;
    const elapsed = motion.lastWheelTime
      ? Math.max(now - motion.lastWheelTime, 16)
      : 16;
    motion.lastWheelTime = now;
    updateGestureVelocity(horizontalDelta / elapsed);
    motion.pauseUntil = now + 90;
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
    if (ambientMotion) {
      updateGestureVelocity(drag.velocity);
      motionRef.current.pauseUntil =
        performance.now() + (drag.pointerType === "mouse" ? 36 : 150);
    }
    dragRef.current = null;
    setIsDragging(false);
  };

  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">{t("noProductsFound")}</p>
    );
  }

  return (
    <div className="product-carousel">
      <section
        ref={viewportRef}
        className={`product-carousel__viewport${isDragging ? " is-dragging" : ""}`}
        data-motion={ambientMotion ? "ambient" : "manual"}
        aria-label={ariaLabel ?? tHome("featuredProducts")}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Focus lets keyboard users scroll the overflow region with arrow keys.
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          lastPointerInteractionRef.current = performance.now();
          dragRef.current = {
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            startX: event.clientX,
            startScrollLeft: event.currentTarget.scrollLeft,
            lastX: event.clientX,
            lastTime: event.timeStamp,
            velocity: motionRef.current.velocity,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const distance = event.clientX - drag.startX;
          const elapsed = Math.max(event.timeStamp - drag.lastTime, 8);
          const instantaneousVelocity = -(event.clientX - drag.lastX) / elapsed;
          drag.velocity = clampVelocity(
            drag.velocity * 0.28 + instantaneousVelocity * 0.72,
          );
          drag.lastX = event.clientX;
          drag.lastTime = event.timeStamp;
          if (ambientMotion && Math.abs(instantaneousVelocity) > 0.008) {
            updateGestureVelocity(drag.velocity);
            motionRef.current.pauseUntil = performance.now() + 90;
          }
          if (!drag.moved && Math.abs(distance) < 6) return;
          drag.moved = true;
          if (drag.pointerType !== "mouse") return;
          if (!isDragging) {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            setIsDragging(true);
          }
          event.preventDefault();
          event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (dragRef.current && !dragRef.current.moved) dragRef.current = null;
        }}
        onDragStart={(event) => event.preventDefault()}
        onWheel={handleWheel}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
      >
        {[0, 1, 2].flatMap((copy) =>
          cycle.map((product, index) => (
            <div
              key={`${copy}-${index}-${product.id}`}
              className="product-carousel__item"
            >
              <ProductCard
                product={product}
                basePath={basePath}
                index={index}
                listId={listId}
                listName={listName}
                currency={currency}
                fetchPriority={
                  priorityFirst && copy === 1 && index === 0
                    ? "high"
                    : undefined
                }
              />
            </div>
          )),
        )}
      </section>
    </div>
  );
}
