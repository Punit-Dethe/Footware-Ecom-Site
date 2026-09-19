"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  listMediaLibraryAssetsAction,
  attachMediaAssetsToProductAction,
} from "@/lib/actions/admin-media-library";
import type { MediaLibraryAssetItem } from "@/lib/db/media-v1";

interface ProductMediaLibraryPickerProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  attachedAssetIds: string[];
  onAttachSuccess: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function ProductMediaLibraryPicker({
  productId,
  isOpen,
  onClose,
  attachedAssetIds,
  onAttachSuccess,
  triggerRef,
}: ProductMediaLibraryPickerProps) {
  const [assets, setAssets] = useState<MediaLibraryAssetItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<
    "created_desc" | "created_asc" | "size_desc" | "size_asc"
  >("created_desc");
  const [isLoading, setIsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );

  const activeElementBeforeOpen = useRef<HTMLElement | null>(null);
  const attachedSet = new Set(attachedAssetIds);

  // Focus tracking for dialog restoration
  useEffect(() => {
    if (isOpen) {
      if (
        !activeElementBeforeOpen.current &&
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement
      ) {
        activeElementBeforeOpen.current = document.activeElement;
      }
      setSelectedAssetIds(new Set());
      setErrorMessage(null);
    } else {
      activeElementBeforeOpen.current = null;
    }
  }, [isOpen]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch media library items
  const fetchLibrary = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await listMediaLibraryAssetsAction({
        q: debouncedQuery || undefined,
        sort,
        page,
        limit,
      });

      if (res.success && res.data) {
        setAssets(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        setErrorMessage(res.error || "Failed to load media assets.");
        setAssets([]);
        setTotalCount(0);
      }
    } catch {
      setErrorMessage("Network error while loading media library.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, debouncedQuery, sort, page, limit]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const toggleSelect = (id: string) => {
    if (attachedSet.has(id)) return;
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAttach = async () => {
    if (selectedAssetIds.size === 0 || isAttaching) return;
    setIsAttaching(true);
    setErrorMessage(null);

    try {
      const idsToAttach = Array.from(selectedAssetIds);
      const res = await attachMediaAssetsToProductAction(
        productId,
        idsToAttach,
      );

      if (res.success) {
        onAttachSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to attach media assets.");
      }
    } catch {
      setErrorMessage("Network error while attaching media.");
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isAttaching) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="admin-drawer-backdrop" />
        <DialogPrimitive.Content
          className="admin-modal-panel p-6 sm:p-8 outline-none max-w-4xl w-[94vw] max-h-[90vh] flex flex-col"
          onEscapeKeyDown={(e) => {
            if (isAttaching) {
              e.preventDefault();
            }
          }}
          onCloseAutoFocus={(e) => {
            const target =
              triggerRef?.current ?? activeElementBeforeOpen.current;
            if (target && typeof target.focus === "function") {
              e.preventDefault();
              target.focus();
            }
          }}
        >
          <DialogPrimitive.Description className="sr-only">
            Select one or more assets from the Mirza media library to attach to this product.
          </DialogPrimitive.Description>

          {/* Header */}
          <div className="flex items-baseline justify-between border-b border-[#cfc4b6] pb-4 flex-shrink-0">
            <div>
              <span className="admin-eyebrow">Mirza Archive</span>
              <DialogPrimitive.Title asChild>
                <h2 className="admin-title text-2xl mt-0.5">Select from Library</h2>
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                disabled={isAttaching}
                className="text-[#706257] hover:text-[#30261f] text-sm p-1 transition-colors"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-4 border-b border-[#e9e2d6] flex-shrink-0">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library assets..."
                className="admin-input w-full text-xs"
                aria-label="Search library assets"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#706257] whitespace-nowrap">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
                className="admin-select text-xs py-1.5 px-2.5"
                aria-label="Sort library assets"
              >
                <option value="created_desc">Newest first</option>
                <option value="created_asc">Oldest first</option>
                <option value="size_desc">Largest size</option>
                <option value="size_asc">Smallest size</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="my-3 p-3 bg-[#faefef] border border-[#deb8b8] text-[#8f2d2d] text-xs rounded-[2px] flex-shrink-0">
              {errorMessage}
            </div>
          )}

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="py-20 text-center text-[#706257] text-xs">
                Loading library assets...
              </div>
            ) : assets.length === 0 ? (
              <div className="py-20 text-center bg-[#fffefc] border border-[#e9e2d6] rounded-[2px]">
                <p className="admin-subtitle text-sm">
                  {debouncedQuery
                    ? `No library assets found matching "${debouncedQuery}".`
                    : "The media library is empty."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {assets.map((asset) => {
                  const isAttached = attachedSet.has(asset.id);
                  const isSelected = selectedAssetIds.has(asset.id);

                  return (
                    <button
                      type="button"
                      key={asset.id}
                      disabled={isAttached}
                      onClick={() => toggleSelect(asset.id)}
                      aria-label={`${asset.original_filename || "Asset"}${
                        isAttached
                          ? " (Already attached)"
                          : isSelected
                            ? " (Selected)"
                            : ""
                      }`}
                      className={`admin-media-card relative text-left transition-all ${
                        isAttached
                          ? "opacity-50 cursor-not-allowed border-[#d8d0c5] bg-[#f9f7f4]"
                          : isSelected
                            ? "admin-media-card--selected ring-2 ring-[#30261f]"
                            : "hover:border-[#30261f]"
                      }`}
                    >
                      {/* Selection Checkmark / Already Attached Tag */}
                      <div className="absolute top-2 right-2 z-10">
                        {isAttached ? (
                          <span className="admin-badge admin-badge--used text-[8px] py-0.5 px-1.5 shadow-sm">
                            Attached
                          </span>
                        ) : isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-[#30261f] text-[#fffefc] flex items-center justify-center text-xs font-bold shadow-sm">
                            ✓
                          </span>
                        ) : null}
                      </div>

                      {/* Stone Image Canvas */}
                      <div className="admin-stone-frame">
                        {asset.publicUrl ? (
                          <Image
                            src={asset.publicUrl}
                            alt={asset.original_filename || "Asset thumbnail"}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain p-2 pointer-events-none"
                            placeholder={asset.lqip ? "blur" : "empty"}
                            blurDataURL={asset.lqip || undefined}
                          />
                        ) : (
                          <div className="text-xs text-[#706257]">No preview</div>
                        )}
                      </div>

                      {/* Card Metadata */}
                      <div className="p-2 bg-[#fffefc] border-t border-[#e9e2d6] w-full flex-1 flex flex-col justify-between">
                        <p
                          className="text-xs font-medium text-[#30261f] truncate"
                          title={asset.original_filename || asset.id}
                        >
                          {asset.original_filename || "Untitled"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#706257] mt-1">
                          <span className="tabular-nums">
                            {asset.width && asset.height
                              ? `${asset.width}×${asset.height}`
                              : "—"}
                          </span>
                          <span>
                            {asset.usageCount > 0 ? `Used ${asset.usageCount}×` : "Unused"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Pagination & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#cfc4b6] flex-shrink-0">
            {/* Pagination */}
            <div className="flex items-center gap-2 text-xs text-[#706257]">
              {totalPages > 1 && (
                <>
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="admin-btn admin-btn-secondary text-xs py-1 px-2.5"
                  >
                    &larr; Prev
                  </button>
                  <span className="tabular-nums text-[11px]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="admin-btn admin-btn-secondary text-xs py-1 px-2.5"
                  >
                    Next &rarr;
                  </button>
                </>
              )}
              <span className="text-[11px] text-[#8c7e73] ml-2">
                {totalCount} total assets
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isAttaching}
                className="admin-btn admin-btn-quiet"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttach}
                disabled={selectedAssetIds.size === 0 || isAttaching}
                className="admin-btn admin-btn-primary"
              >
                {isAttaching
                  ? "Attaching..."
                  : selectedAssetIds.size > 0
                    ? `Attach ${selectedAssetIds.size} Media`
                    : "Attach Media"}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
