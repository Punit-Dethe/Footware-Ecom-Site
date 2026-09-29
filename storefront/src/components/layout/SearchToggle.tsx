"use client";

import { Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const SearchBar = dynamic(
  () =>
    import("@/components/search/SearchBar").then((mod) => ({
      default: mod.SearchBar,
    })),
  {
    loading: () => (
      <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
    ),
  },
);

interface SearchToggleProps {
  basePath: string;
  /** Left slot (e.g. mobile menu) */
  left: ReactNode;
  /** Center slot (e.g. logo) */
  center: ReactNode;
  /** Rendered before the search button in the right section */
  rightStart: ReactNode;
  /** Rendered after the search button in the right section */
  rightEnd: ReactNode;
}

export function SearchToggle({
  basePath,
  left,
  center,
  rightStart,
  rightEnd,
}: SearchToggleProps) {
  const t = useTranslations("header");
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const isScrolledRef = useRef(false);
  const isHiddenRef = useRef(false);
  const searchOpenRef = useRef(searchOpen);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  searchOpenRef.current = searchOpen;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    let lastY = Math.max(0, window.scrollY);
    let direction = 0;
    let distance = 0;

    const showHeader = () => {
      isHiddenRef.current = false;
      header.classList.remove("editorial-header--hidden");
    };
    const updateScroll = () => {
      frame = 0;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(maxY, window.scrollY));
      const delta = y - lastY;
      lastY = y;
      const isScrolled = y > 28;
      isScrolledRef.current = isScrolled;
      header.classList.toggle(
        "editorial-header--solid",
        isScrolled || searchOpenRef.current,
      );

      const interactionOpen = searchOpenRef.current ||
        header.matches(":focus-visible") ||
        Boolean(header.querySelector(":focus-visible")) ||
        Boolean(header.querySelector('[aria-expanded="true"], [data-state="open"]')) ||
        document.body.hasAttribute("data-scroll-locked") ||
        getComputedStyle(document.body).overflowY === "hidden" ||
        getComputedStyle(document.documentElement).overflowY === "hidden";
      if (y <= header.offsetHeight + 24 || interactionOpen) {
        showHeader();
        direction = 0;
        distance = 0;
        return;
      }
      if (delta === 0) return;
      const nextDirection = delta > 0 ? 1 : -1;
      if (nextDirection !== direction) {
        direction = nextDirection;
        distance = 0;
      }
      distance += Math.abs(delta);
      if (distance >= (direction > 0 ? 12 : 8)) {
        isHiddenRef.current = direction > 0;
        header.classList.toggle("editorial-header--hidden", isHiddenRef.current);
        distance = 0;
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };

    // Menu/popover triggers and scroll locks can change without a scroll event.
    const observer = new MutationObserver(schedule);
    observer.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "data-state"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked"],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    updateScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchTriggerRef.current?.focus();
  }, []);

  return (
    <header
      ref={headerRef}
      onFocusCapture={() => {
        isHiddenRef.current = false;
        headerRef.current?.classList.remove("editorial-header--hidden");
      }}
      className={`editorial-header sticky top-0 z-50 h-[74px] border-b ${
        isScrolledRef.current || searchOpen ? "editorial-header--solid" : ""
      } ${isHiddenRef.current ? "editorial-header--hidden" : ""}`}
    >
      {/* Normal header content */}
      <div
        className={`absolute inset-0 transition-all duration-300 ease-in-out ${
          searchOpen
            ? "translate-y-4 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center h-full w-full">
            {/* Left section */}
            <div className="flex items-center flex-1">{left}</div>

            {/* Center section */}
            <div className="flex justify-center min-w-0">{center}</div>

            {/* Right section */}
            <div className="flex items-center flex-1 justify-end space-x-2">
              {rightStart}

              {/* Search toggle */}
              <Button
                ref={searchTriggerRef}
                variant="ghost"
                size="icon-lg"
                onClick={() => setSearchOpen(true)}
                aria-label={t("openSearch")}
                aria-expanded={searchOpen}
                aria-controls="search-overlay"
              >
                <Search className="size-5" />
              </Button>

              {rightEnd}
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSearch}
          role="presentation"
        />
      )}

      {/* Search bar overlay */}
      <div
        id="search-overlay"
        inert={!searchOpen}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeSearch();
        }}
        className={`absolute inset-0 z-50 transition-all duration-300 ease-in-out ${
          searchOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              key={String(searchOpen)}
              basePath={basePath}
              autoFocus={searchOpen}
              onNavigate={closeSearch}
            />
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={closeSearch}
            aria-label={t("closeSearch")}
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
