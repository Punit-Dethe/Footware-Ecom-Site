"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFilterBarProps {
  categories: CategoryOption[];
  currentQuery?: string;
  currentStatus?: string;
  currentCategory?: string;
  currentSort?: string;
}

export function ProductFilterBar({
  categories,
  currentQuery = "",
  currentStatus = "all",
  currentCategory = "",
  currentSort = "updated_desc",
}: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentQuery);

  // Sync internal search input with URL when external navigation happens
  useEffect(() => {
    setSearch(currentQuery);
  }, [currentQuery]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (
          value === null ||
          value === "" ||
          (key === "status" && value === "all") ||
          (key === "sort" && value === "updated_desc") ||
          (key === "page" && value === "1")
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== currentQuery.trim()) {
        updateUrl({ q: search.trim() || null, page: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, currentQuery, updateUrl]);

  const hasActiveFilters = Boolean(
    currentQuery ||
      (currentStatus && currentStatus !== "all") ||
      currentCategory ||
      (currentSort && currentSort !== "updated_desc"),
  );

  const handleClearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[#fffefc] border border-[#cfc4b6] rounded-[2px]">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#706257] pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or slug..."
            className="admin-search-input"
            aria-label="Search products"
          />
        </div>

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateUrl({ status: e.target.value, page: null })}
          className="admin-select text-xs font-medium !py-2 uppercase tracking-wider"
          aria-label="Filter by Status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        {/* Category Filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateUrl({ category: e.target.value || null, page: null })}
          className="admin-select text-xs font-medium !py-2"
          aria-label="Filter by Category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          value={currentSort}
          onChange={(e) => updateUrl({ sort: e.target.value, page: null })}
          className="admin-select text-xs font-medium !py-2"
          aria-label="Sort products"
        >
          <option value="updated_desc">Recently Updated</option>
          <option value="name_asc">Name (A–Z)</option>
          <option value="stock_low">Stock: Low &rarr; High</option>
          <option value="stock_high">Stock: High &rarr; Low</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs text-[#706257] hover:text-[#30261f] underline whitespace-nowrap self-end md:self-center"
        >
          Clear filters
        </button>
      )}

      {isPending && (
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#706257] animate-pulse self-center">
          Updating...
        </span>
      )}
    </div>
  );
}
