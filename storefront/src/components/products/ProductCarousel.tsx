"use client";

import { useTranslations } from "next-intl";
import {
  type PointerEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/commerce";

interface ProductCarouselProps {
  products: Product[];
  basePath: string;
  currency?: string;
}

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
}

export function ProductCarousel({
  products,
  basePath,
  currency,
}: ProductCarouselProps) {
  const t = useTranslations("products");
  const tHome = useTranslations("home");
  const viewportRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
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
        aria-label={tHome("featuredProducts")}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Focus lets keyboard users scroll the overflow region with arrow keys.
        tabIndex={0}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: event.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const distance = event.clientX - drag.startX;
          if (!drag.moved && Math.abs(distance) < 6) return;
          if (!drag.moved) {
            drag.moved = true;
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
                listId="featured-products"
                listName="Featured Products"
                currency={currency}
                fetchPriority={copy === 1 && index === 0 ? "high" : undefined}
              />
            </div>
          )),
        )}
      </section>
    </div>
  );
}
