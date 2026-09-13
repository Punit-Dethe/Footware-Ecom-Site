"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/commerce";

interface ProductCarouselProps {
  products: Product[];
  basePath: string;
  /** Optional currency used for analytics in each ProductCard. */
  currency?: string;
}

export function ProductCarousel({
  products,
  basePath,
  currency,
}: ProductCarouselProps): ReactElement {
  const t = useTranslations("products");
  const tHome = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      // Horizontal trackpad gestures retain the browser's native behavior.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const step =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * el.clientWidth
            : event.deltaY;
      const next = Math.min(maxScroll, Math.max(0, el.scrollLeft + step));

      // Let the page scroll normally once the row reaches either end.
      if (Math.abs(next - el.scrollLeft) < 1) return;
      event.preventDefault();
      el.scrollLeft = next;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="product-carousel">
      <section
        ref={scrollRef}
        className="product-carousel__viewport"
        aria-label={tHome("featuredProducts")}
      >
        {products.map((product, index) => (
          <div key={product.id} className="product-carousel__item">
            <ProductCard
              product={product}
              basePath={basePath}
              index={index}
              listId="featured-products"
              listName="Featured Products"
              currency={currency}
              fetchPriority={index === 0 ? "high" : undefined}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
