"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { JSX } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import { AvailabilityDropdownContent } from "@/components/products/filters/AvailabilityDropdownContent";
import { FilterBarSkeleton } from "@/components/products/filters/FilterBarSkeleton";
import { FilterChips } from "@/components/products/filters/FilterChips";
import { FilterDropdown } from "@/components/products/filters/FilterDropdown";
import { MobileFilterDrawer } from "@/components/products/filters/MobileFilterDrawer";
import { OptionDropdownContent } from "@/components/products/filters/OptionDropdownContent";
import { PriceDropdownContent } from "@/components/products/filters/PriceDropdownContent";
import { SortDropdownContent } from "@/components/products/filters/SortDropdownContent";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getActiveFilterCount } from "@/lib/utils/filters";
import { generatePriceBuckets } from "@/lib/utils/price-buckets";
import type {
  AvailabilityFilter,
  CategoryFilter,
  OptionFilter,
  PriceRangeFilter,
  ProductFiltersResponse,
} from "@/types/commerce";
import type { ActiveFilters, AvailabilityStatus } from "@/types/filters";

interface FilterBarProps {
  filtersData: ProductFiltersResponse | null;
  filtersLoading: boolean;
  activeFilters: ActiveFilters;
  totalCount: number;
  basePath?: string;
  onFilterChange: (filters: ActiveFilters) => void;
}

export const FilterBar = memo(function FilterBar({
  filtersData,
  filtersLoading,
  activeFilters,
  totalCount,
  basePath = "",
  onFilterChange,
}: FilterBarProps): JSX.Element | null {
  const t = useTranslations("products");
  const locale = useLocale();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const handleOptionValueToggle = useCallback(
    (optionValueId: string) => {
      const newOptionValues = activeFilters.optionValues.includes(optionValueId)
        ? activeFilters.optionValues.filter((id) => id !== optionValueId)
        : [...activeFilters.optionValues, optionValueId];
      onFilterChange({ ...activeFilters, optionValues: newOptionValues });
    },
    [activeFilters, onFilterChange],
  );

  const handlePriceChange = useCallback(
    (min?: number, max?: number) => {
      onFilterChange({ ...activeFilters, priceMin: min, priceMax: max });
    },
    [activeFilters, onFilterChange],
  );

  const handleAvailabilityChange = useCallback(
    (availability?: AvailabilityStatus) => {
      onFilterChange({ ...activeFilters, availability });
    },
    [activeFilters, onFilterChange],
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      onFilterChange({ ...activeFilters, sortBy });
      closeDropdown();
    },
    [activeFilters, onFilterChange, closeDropdown],
  );

  const clearFilters = useCallback(() => {
    onFilterChange({
      optionValues: [],
      priceMin: undefined,
      priceMax: undefined,
      availability: undefined,
      sortBy: activeFilters.sortBy,
    });
  }, [onFilterChange, activeFilters.sortBy]);

  const priceBuckets = useMemo(() => {
    if (!filtersData?.filters) return [];
    const priceFilter = filtersData.filters.find(
      (f) => f.type === "price_range",
    ) as PriceRangeFilter | undefined;
    if (!priceFilter) return [];
    return generatePriceBuckets(
      priceFilter.min,
      priceFilter.max,
      priceFilter.currency || "USD",
      { t, locale },
    );
  }, [filtersData, t, locale]);

  const optionFilters = useMemo(() => {
    if (!filtersData?.filters) return [];
    return filtersData.filters.filter(
      (f) => f.type === "option",
    ) as OptionFilter[];
  }, [filtersData]);

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const filter of optionFilters) {
      counts[filter.id] = filter.options.filter((o) =>
        activeFilters.optionValues.includes(o.id),
      ).length;
    }
    return counts;
  }, [optionFilters, activeFilters.optionValues]);

  const priceBadge =
    activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined
      ? 1
      : 0;

  const availabilityBadge = activeFilters.availability ? 1 : 0;

  const totalActiveFilters = getActiveFilterCount(activeFilters);

  const hasActiveFilters = totalActiveFilters > 0;

  const activeSortBy = activeFilters.sortBy || filtersData?.default_sort;

  if (!filtersData) {
    if (filtersLoading) return <FilterBarSkeleton />;
    return null;
  }

  const availabilityFilter = filtersData.filters?.find(
    (f) => f.type === "availability",
  ) as AvailabilityFilter | undefined;
  const categoryFilter = filtersData.filters?.find(
    (filter) => filter.type === "category",
  ) as CategoryFilter | undefined;
  const activeCategory = categoryFilter?.options.find(
    (option) => option.active,
  );
  const activeSortLabel =
    filtersData.sort_options?.find((option) => option.id === activeSortBy)
      ?.label ??
    filtersData.sort_options?.[0]?.label ??
    t("sort");

  const hasPriceFilter =
    Boolean(filtersData.filters?.some((f) => f.type === "price_range")) &&
    priceBuckets.length > 0;

  return (
    <div className="catalog-filter-bar mb-6">
      <div className="catalog-filter-bar__desktop hidden md:flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="catalog-filter-bar__controls flex items-center gap-3">
          <span className="catalog-filter-bar__label">{t("filters")}:</span>
          {categoryFilter && (
            <FilterDropdown
              label={
                activeCategory?.label ||
                activeCategory?.name ||
                t("allProducts")
              }
              isOpen={openDropdownId === "category"}
              onToggle={() => toggleDropdown("category")}
              onClose={closeDropdown}
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`${basePath}/products`}
                  scroll={false}
                  prefetch
                  aria-current={activeCategory ? undefined : "page"}
                  className="catalog-category-option"
                  onClick={closeDropdown}
                >
                  <span>{t("allProducts")}</span>
                  {!activeCategory && <Check aria-hidden="true" />}
                </Link>
              </DropdownMenuItem>
              {categoryFilter.options.map((option) => (
                <DropdownMenuItem key={option.id} asChild>
                  <Link
                    href={`${basePath}/products?category=${encodeURIComponent(option.slug ?? option.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
                    scroll={false}
                    prefetch
                    aria-current={option.active ? "page" : undefined}
                    className="catalog-category-option"
                    onClick={closeDropdown}
                  >
                    <span>{option.label || option.name}</span>
                    {option.active && <Check aria-hidden="true" />}
                  </Link>
                </DropdownMenuItem>
              ))}
            </FilterDropdown>
          )}
          {optionFilters.map((filter) => (
            <FilterDropdown
              key={filter.id}
              label={filter.label || filter.name}
              badgeCount={badgeCounts[filter.id]}
              isOpen={openDropdownId === filter.id}
              onToggle={() => toggleDropdown(filter.id)}
              onClose={closeDropdown}
            >
              <OptionDropdownContent
                filter={filter}
                selectedValues={activeFilters.optionValues}
                onToggle={handleOptionValueToggle}
              />
            </FilterDropdown>
          ))}

          {hasPriceFilter && (
            <FilterDropdown
              label={t("price")}
              badgeCount={priceBadge}
              isOpen={openDropdownId === "price"}
              onToggle={() => toggleDropdown("price")}
              onClose={closeDropdown}
            >
              <PriceDropdownContent
                priceBuckets={priceBuckets}
                activeFilters={activeFilters}
                onPriceChange={handlePriceChange}
              />
            </FilterDropdown>
          )}

          {availabilityFilter && (
            <FilterDropdown
              label={t("availability")}
              badgeCount={availabilityBadge}
              isOpen={openDropdownId === "availability"}
              onToggle={() => toggleDropdown("availability")}
              onClose={closeDropdown}
            >
              <AvailabilityDropdownContent
                filter={availabilityFilter}
                selected={activeFilters.availability}
                onChange={handleAvailabilityChange}
              />
            </FilterDropdown>
          )}
        </div>

        <div className="catalog-filter-bar__meta flex items-center gap-3">
          <FilterDropdown
            label={`${t("sort")}: ${activeSortLabel}`}
            isOpen={openDropdownId === "sort"}
            onToggle={() => toggleDropdown("sort")}
            onClose={closeDropdown}
            align="right"
          >
            <SortDropdownContent
              sortOptions={filtersData.sort_options || []}
              activeSortBy={activeSortBy}
              onSortChange={handleSortChange}
            />
          </FilterDropdown>
          <span className="catalog-filter-bar__count">
            {t("productCount", { count: totalCount })}
          </span>
        </div>
      </div>

      <div className="catalog-filter-bar__mobile flex items-center gap-3 md:hidden pb-4 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setShowMobileDrawer(true)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            hasActiveFilters
              ? "border-gray-500 bg-gray-50 text-primary"
              : "border-gray-300 text-gray-700"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t("filters")}</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 text-xs bg-primary text-white rounded-lg">
              {totalActiveFilters}
            </span>
          )}
        </button>

        <div className="ml-auto">
          <FilterDropdown
            label={`${t("sort")}: ${activeSortLabel}`}
            isOpen={openDropdownId === "sort-mobile"}
            onToggle={() => toggleDropdown("sort-mobile")}
            onClose={closeDropdown}
            align="right"
          >
            <SortDropdownContent
              sortOptions={filtersData.sort_options || []}
              activeSortBy={activeSortBy}
              onSortChange={handleSortChange}
            />
          </FilterDropdown>
        </div>
      </div>

      {hasActiveFilters && (
        <FilterChips
          activeFilters={activeFilters}
          filtersData={filtersData}
          priceBuckets={priceBuckets}
          onRemoveOptionValue={(id) => handleOptionValueToggle(id)}
          onRemovePrice={() => handlePriceChange(undefined, undefined)}
          onRemoveAvailability={() => handleAvailabilityChange(undefined)}
          onClearAll={clearFilters}
        />
      )}

      <MobileFilterDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        filtersData={filtersData}
        basePath={basePath}
        activeFilters={activeFilters}
        priceBuckets={priceBuckets}
        onApply={onFilterChange}
      />
    </div>
  );
});
