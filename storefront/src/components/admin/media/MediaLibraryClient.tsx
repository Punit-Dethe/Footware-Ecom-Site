"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { MediaLibraryAssetItem } from "@/lib/db/media-v1";
import { MediaUploadModal } from "./MediaUploadModal";
import { MediaDetailDrawer } from "./MediaDetailDrawer";

interface MediaLibraryClientProps {
  initialAssets: MediaLibraryAssetItem[];
  totalCount: number;
  page: number;
  limit: number;
  searchParamsState: {
    q: string;
    provider: string;
    sort: string;
  };
  country: string;
  locale: string;
}

export function MediaLibraryClient({
  initialAssets,
  totalCount,
  page,
  limit,
  searchParamsState,
  country,
  locale,
}: MediaLibraryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParamsState.q);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibraryAssetItem | null>(
    null,
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const activeTriggerRef = useRef<HTMLElement | null>(null);

  // Sync state if URL param changes externally
  useEffect(() => {
    setSearchQuery(searchParamsState.q);
  }, [searchParamsState.q]);

  // Keep selected asset up to date if list refreshes
  useEffect(() => {
    if (selectedAsset) {
      const refreshed = initialAssets.find((a) => a.id === selectedAsset.id);
      if (refreshed) {
        setSelectedAsset(refreshed);
      }
    }
  }, [initialAssets, selectedAsset]);

  // Push new query parameters cleanly to the URL
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || (key === "page" && value === "1")) {
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

  // Debounced search query handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchParamsState.q) {
        updateUrl({ q: searchQuery.trim() || null, page: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParamsState.q, updateUrl]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startOffset = (page - 1) * limit;
  const currentRangeStart = totalCount === 0 ? 0 : startOffset + 1;
  const currentRangeEnd = Math.min(startOffset + initialAssets.length, totalCount);

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Mirza Visual Archive</span>
          <h1 className="admin-title mt-1 text-3xl sm:text-4xl">Media Library</h1>
          <p className="admin-subtitle mt-2 max-w-xl">
            A working library of product imagery, campaign assets, and Mirza visual material.
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            activeTriggerRef.current = e.currentTarget;
            setIsUploadModalOpen(true);
          }}
          className="admin-btn admin-btn-primary self-start sm:self-auto"
        >
          + Upload Media
        </button>
      </div>

      {/* Controls Bar: Search, Provider Filter, Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#fffefc] border border-[#cfc4b6] p-3 sm:p-4 rounded-[2px]">
        {/* Left: Search input */}
        <div className="relative w-full lg:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or path..."
            className="admin-input w-full pr-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                updateUrl({ q: null, page: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#706257] hover:text-[#30261f]"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Center: Provider Filter Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { label: "Supabase", value: "supabase" },
            { label: "All Media", value: "all" },
            { label: "Legacy Rollback", value: "legacy_public" },
          ].map((tab) => {
            const isCurrent = searchParamsState.provider === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateUrl({ provider: tab.value, page: null })}
                className={`admin-btn text-[10px] py-1.5 px-3 whitespace-nowrap ${
                  isCurrent
                    ? "admin-btn-secondary font-semibold"
                    : "admin-btn-quiet text-[#706257]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Sort selector & Asset Count */}
        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#706257] hidden sm:inline text-[11px]">Sort:</span>
            <select
              value={searchParamsState.sort}
              onChange={(e) => updateUrl({ sort: e.target.value, page: null })}
              className="admin-select text-xs py-1.5 px-2.5"
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="size_desc">Largest size</option>
              <option value="size_asc">Smallest size</option>
            </select>
          </div>

          <span className="admin-mono text-[#706257] text-[11px] whitespace-nowrap">
            {totalCount} {totalCount === 1 ? "asset" : "assets"}
          </span>
        </div>
      </div>

      {/* Loading Overlay State */}
      <div className={`transition-opacity duration-200 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        {/* Media Grid */}
        {initialAssets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {initialAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;
              const isLegacy = asset.storage_provider === "legacy_public";

              return (
                <button
                  type="button"
                  key={asset.id}
                  onClick={(e) => {
                    activeTriggerRef.current = e.currentTarget;
                    setSelectedAsset(asset);
                  }}
                  aria-label={`Inspect ${asset.original_filename || asset.id}`}
                  className={`admin-media-card ${isSelected ? "admin-media-card--selected" : ""}`}
                >
                  {/* Image Canvas with baked stone background */}
                  <div className="admin-stone-frame">
                    {asset.publicUrl ? (
                      <Image
                        src={asset.publicUrl}
                        alt={asset.original_filename || "Asset thumbnail"}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className="object-contain p-2 pointer-events-none"
                        placeholder={asset.lqip ? "blur" : "empty"}
                        blurDataURL={asset.lqip || undefined}
                      />
                    ) : (
                      <div className="text-xs text-[#706257]">No preview</div>
                    )}
                  </div>

                  {/* Card Meta Content */}
                  <div className="p-2.5 bg-[#fffefc] border-t border-[#d8d0c5] flex-1 flex flex-col justify-between w-full">
                    <div>
                      <p className="text-xs font-medium text-[#30261f] truncate" title={asset.original_filename || asset.id}>
                        {asset.original_filename || "Untitled Asset"}
                      </p>
                      <p className="admin-mono text-[10px] text-[#706257] mt-0.5">
                        {asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-[#f3efe8]">
                      {asset.usageCount > 0 ? (
                        <span className="admin-badge admin-badge--used text-[8px] py-0 px-1.5">
                          Used {asset.usageCount}×
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge--unused text-[8px] py-0 px-1.5">
                          Unused
                        </span>
                      )}

                      {isLegacy && (
                        <span className="admin-badge admin-badge--legacy text-[8px] py-0 px-1" title="Legacy static rollback copy">
                          Rollback
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );

            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 px-4 text-center bg-[#fffefc] border border-[#cfc4b6] rounded-[2px]">
            <span className="admin-eyebrow">Zero Results</span>
            <h3 className="admin-title text-2xl mt-1 mb-2">No media found</h3>
            <p className="admin-subtitle text-sm max-w-md mx-auto mb-6">
              {searchQuery
                ? `No media assets match "${searchQuery}". Try adjusting your search or provider filter.`
                : "The selected library filter contains no media assets."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateUrl({ q: null, page: null });
                }}
                className="admin-btn admin-btn-secondary text-xs"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#cfc4b6] pt-6 mt-8">
            <span className="text-xs text-[#706257]">
              Showing <span className="font-semibold text-[#30261f]">{currentRangeStart}–{currentRangeEnd}</span> of{" "}
              <span className="font-semibold text-[#30261f]">{totalCount}</span> assets
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateUrl({ page: String(page - 1) })}
                className="admin-btn admin-btn-secondary text-xs py-1.5 px-3"
              >
                &larr; Previous
              </button>

              <span className="admin-mono text-xs px-2 text-[#706257]">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateUrl({ page: String(page + 1) })}
                className="admin-btn admin-btn-secondary text-xs py-1.5 px-3"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Asset Detail Drawer */}
      <MediaDetailDrawer
        asset={selectedAsset}
        country={country}
        locale={locale}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        onDeleteSuccess={() => {
          setSelectedAsset(null);
          router.refresh();
        }}
        triggerRef={activeTriggerRef}
      />

      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={(newAssetId) => {
          router.refresh();
        }}
        triggerRef={activeTriggerRef}
      />
    </div>
  );
}
