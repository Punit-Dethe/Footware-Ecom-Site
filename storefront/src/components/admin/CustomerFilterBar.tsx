"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CustomerFilterBarProps {
  currentQuery?: string;
  currentSort?: string;
}

export function CustomerFilterBar({
  currentQuery = "",
  currentSort = "newest",
}: CustomerFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentQuery);

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
          (key === "sort" && value === "newest") ||
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== currentQuery.trim()) {
        updateUrl({ q: search.trim() || null, page: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, currentQuery, updateUrl]);

  const hasActiveFilters = Boolean(
    currentQuery || (currentSort && currentSort !== "newest"),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, customer name, or phone..."
            className="admin-input pl-9 text-xs"
            aria-label="Search customers"
          />
          <svg
            className="w-4 h-4 text-[#706257] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="customer-sort" className="text-xs text-[#706257]">
              Sort:
            </label>
            <select
              id="customer-sort"
              value={currentSort}
              onChange={(e) => updateUrl({ sort: e.target.value, page: null })}
              className="admin-input py-1.5 px-2.5 text-xs bg-[#fffefc] w-auto cursor-pointer"
            >
              <option value="newest">Newest Members First</option>
              <option value="oldest">Oldest Members First</option>
              <option value="latest_order">Recent Order Activity</option>
              <option value="most_orders">Most Orders</option>
              <option value="highest_order_total">Highest Order Value</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                startTransition(() => {
                  router.push(pathname);
                });
              }}
              className="admin-btn admin-btn-quiet text-xs py-1.5 px-2.5"
            >
              Reset Filters
            </button>
          )}

          {isPending && (
            <span className="text-[11px] text-[#706257] font-mono animate-pulse">
              Updating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
