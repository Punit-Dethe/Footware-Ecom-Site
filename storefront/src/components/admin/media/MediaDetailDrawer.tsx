"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MediaLibraryAssetItem, MediaLibraryAssetDetail } from "@/lib/db/media-v1";
import {
  getMediaLibraryAssetDetailAction,
  deleteMediaLibraryAssetAction,
} from "@/lib/actions/admin-media-library";

interface MediaDetailDrawerProps {
  asset: MediaLibraryAssetItem | null;
  country: string;
  locale: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

export function MediaDetailDrawer({
  asset,
  country,
  locale,
  isOpen,
  onClose,
  onDeleteSuccess,
}: MediaDetailDrawerProps) {
  const [detail, setDetail] = useState<MediaLibraryAssetDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Fetch full detail with live product placement breakdown when drawer opens
  useEffect(() => {
    if (isOpen && asset) {
      setIsConfirmingDelete(false);
      setErrorMessage(null);
      setWarningMessage(null);
      setIsLoadingDetail(true);

      getMediaLibraryAssetDetailAction(asset.id)
        .then((res) => {
          if (res.success && res.asset) {
            setDetail(res.asset);
          } else {
            setDetail(null);
          }
        })
        .catch(() => setDetail(null))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setDetail(null);
    }
  }, [isOpen, asset]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !asset) return null;

  const currentAsset = detail || asset;
  const isLegacy = currentAsset.storage_provider === "legacy_public";
  const usageCount = detail ? detail.usage.usageCount : asset.usageCount;
  const isInUse = usageCount > 0;

  async function handleDelete() {
    if (!asset) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      setWarningMessage(null);

      const res = await deleteMediaLibraryAssetAction(asset.id);

      if (!res.success) {
        throw new Error(res.error || "Failed to delete media asset.");
      }

      if (res.warning) {
        setWarningMessage(res.warning);
        // Wait briefly so user sees the truthful warning before closing
        setTimeout(() => {
          onDeleteSuccess();
          onClose();
        }, 2200);
      } else {
        onDeleteSuccess();
        onClose();
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected deletion error occurred.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function formatBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} />
      <aside
        className="admin-drawer-panel"
        aria-label="Media asset details"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#cfc4b6] flex items-center justify-between flex-shrink-0">
          <div>
            <span className="admin-eyebrow">Asset Inspector</span>
            <h3 className="admin-title text-xl truncate max-w-[320px] mt-0.5">
              {currentAsset.original_filename || "Untitled Asset"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#706257] hover:text-[#30261f] p-1 text-sm transition-colors"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview Canvas */}
          <div className="admin-stone-frame border border-[#cfc4b6] rounded-[2px]">
            {currentAsset.publicUrl ? (
              <Image
                src={currentAsset.publicUrl}
                alt={currentAsset.original_filename || "Media preview"}
                fill
                sizes="440px"
                className="object-contain p-4"
                placeholder={currentAsset.lqip ? "blur" : "empty"}
                blurDataURL={currentAsset.lqip || undefined}
              />
            ) : (
              <div className="text-xs text-[#706257]">No preview available</div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#706257]">Direct Storage Master</span>
            <a
              href={currentAsset.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#30261f] hover:underline flex items-center gap-1 font-medium"
            >
              Open Full Master ↗
            </a>
          </div>

          <hr className="admin-divider" />

          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="admin-eyebrow">Physical Specifications</h4>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              <div>
                <span className="text-[#706257] block text-[11px]">Dimensions</span>
                <span className="admin-mono font-medium text-[#30261f]">
                  {currentAsset.width ? `${currentAsset.width} × ${currentAsset.height} px` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[#706257] block text-[11px]">Format</span>
                <span className="admin-mono font-medium text-[#30261f]">
                  {currentAsset.mime_type || "—"}
                </span>
              </div>
              <div>
                <span className="text-[#706257] block text-[11px]">File Size</span>
                <span className="admin-mono font-medium text-[#30261f]">
                  {formatBytes(currentAsset.file_size_bytes)}
                </span>
              </div>
              <div>
                <span className="text-[#706257] block text-[11px]">Dominant Color</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {currentAsset.dominant_color && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-[#cfc4b6]"
                      style={{ backgroundColor: currentAsset.dominant_color }}
                    />
                  )}
                  <span className="admin-mono font-medium text-[#30261f]">
                    {currentAsset.dominant_color || "—"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[#706257] block text-[11px]">Provider</span>
                <span className="font-medium text-[#30261f]">
                  {currentAsset.storage_provider === "supabase"
                    ? "Supabase Storage"
                    : "Legacy Static Rollback"}
                </span>
              </div>
              <div>
                <span className="text-[#706257] block text-[11px]">Uploaded</span>
                <span className="text-[#30261f]">
                  {new Date(currentAsset.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <hr className="admin-divider" />

          {/* Product Placements Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="admin-eyebrow">Product Placements</h4>
              <span className={`admin-badge ${isInUse ? "admin-badge--used" : "admin-badge--unused"}`}>
                {usageCount} {usageCount === 1 ? "Product" : "Products"}
              </span>
            </div>

            {isLoadingDetail ? (
              <p className="text-xs text-[#706257] italic">Loading placement report...</p>
            ) : detail && detail.usage.products.length > 0 ? (
              <div className="space-y-2">
                {detail.usage.products.map((prod) => (
                  <div
                    key={prod.productId}
                    className="p-3 bg-[#fffefc] border border-[#cfc4b6] rounded-[2px] flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-[#30261f] truncate">
                        {prod.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#706257]">
                          Pos {prod.position}
                        </span>
                        {prod.isHero && (
                          <span className="admin-badge admin-badge--hero text-[8px] py-0 px-1.5">
                            Hero
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/${country}/${locale}/admin/products/${prod.productId}`}
                      className="text-xs text-[#30261f] hover:underline font-medium whitespace-nowrap"
                    >
                      Edit &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#706257]">
                Not currently placed on any catalog products.
              </p>
            )}
          </div>

          <hr className="admin-divider" />

          {/* Technical Integrity Metadata */}
          <div className="space-y-2">
            <h4 className="admin-eyebrow">Storage &amp; Integrity</h4>
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-[#706257] block text-[10px]">Storage Path</span>
                <span className="admin-mono text-[#30261f] break-all">
                  {currentAsset.storage_path}
                </span>
              </div>
              {currentAsset.content_sha256 && (
                <div>
                  <span className="text-[#706257] block text-[10px]">SHA-256 Digest</span>
                  <span className="admin-mono text-[#30261f] break-all text-[10px]">
                    {currentAsset.content_sha256}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-[#faefef] border border-[#deb8b8] text-[#8f2d2d] text-xs rounded-[2px]">
              {errorMessage}
            </div>
          )}
          {warningMessage && (
            <div className="p-3 bg-[#fdf8ed] border border-[#ecd5a5] text-[#7d5607] text-xs rounded-[2px]">
              {warningMessage}
            </div>
          )}
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-6 border-t border-[#cfc4b6] flex-shrink-0 bg-[#fffefc]">
          {isLegacy ? (
            <div className="text-center p-2.5 bg-[#ece7de] border border-[#cfc4b6] rounded-[2px] text-xs text-[#706257]">
              Read-only rollback asset. Preserved for rollback safety.
            </div>
          ) : isInUse ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="admin-btn admin-btn-danger w-full opacity-50 cursor-not-allowed"
              >
                Delete Asset
              </button>
              <p className="text-[11px] text-[#706257] text-center">
                Cannot delete asset attached to {usageCount} product{usageCount > 1 ? "s" : ""}. Detach from all products first.
              </p>
            </div>
          ) : !isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="admin-btn admin-btn-danger w-full"
            >
              Delete Asset
            </button>
          ) : (
            <div className="space-y-3 p-3.5 bg-[#faefef] border border-[#deb8b8] rounded-[2px]">
              <p className="text-xs font-medium text-[#8f2d2d]">
                Permanently delete this media asset? This will remove the file from storage and database.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="admin-btn admin-btn-quiet text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="admin-btn admin-btn-danger bg-[#8f2d2d] text-white hover:bg-[#722323] text-xs py-1.5 px-3"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
