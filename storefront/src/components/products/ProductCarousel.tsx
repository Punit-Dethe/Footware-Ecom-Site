"use client";

import type { Product } from "@spree/sdk";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";

interface ProductCarouselProps {
  products: Product[];
  basePath: string;
  /** Optional currency used for analytics in each ProductCard. */
  currency?: string;
}

const NAV_BUTTON_BASE =
  "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center cursor-pointer rounded-lg bg-white/95 backdrop-blur-xs border border-gray-300 text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

export function ProductCarousel({
  products,
  basePath,
  currency,
}: ProductCarouselProps): ReactElement {
  const t = useTranslations("products");
  const tHome = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const updateNavState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setIsBeginning(scrollLeft <= 5);
    setIsEnd(scrollLeft + clientWidth >= scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateNavState();

    el.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);

    return () => {
      el.removeEventListener("scroll", updateNavState);
      window.removeEventListener("resize", updateNavState);
    };
  }, [updateNavState]);

  const handleScroll = (direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;

    // Scroll by the width of one visible card group
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("noProductsFound")}</p>
      </div>
    );
  }

  return (
    <section
      className="relative group/carousel"
      aria-roledescription="carousel"
      aria-label={tHome("featuredProducts")}
    >
      <button
        type="button"
        aria-label={t("carouselPrev")}
        disabled={isBeginning}
        onClick={() => handleScroll("prev")}
        className={`${NAV_BUTTON_BASE} -left-5 sm:-left-3`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        aria-label={t("carouselNext")}
        disabled={isEnd}
        onClick={() => handleScroll("next")}
        className={`${NAV_BUTTON_BASE} -right-5 sm:-right-3`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar flex gap-6 pb-2 rounded-lg"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex-none snap-start w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] p-1"
          >
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
      </div>
    </section>
  );
}
