"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  setProductMediaHeroAction,
  detachMediaAssetFromProductAction,
  reorderProductMediaActionV1,
  updateProductMediaAltTextActionV1,
  attachMediaAssetToProductAction,
  getProductMediaV1Action,
} from "@/lib/actions/admin-media-library";
import type { AdminProductMediaPlacement } from "@/lib/db/admin-catalog";
import { ProductMediaLibraryPicker } from "./ProductMediaLibraryPicker";
import { MediaUploadModal } from "./media/MediaUploadModal";

interface ProductMediaManagerProps {
  productId: string;
  productStatus: "draft" | "active" | "archived";
  initialMedia: AdminProductMediaPlacement[];
}

export function ProductMediaManager({
  productId,
  productStatus,
  initialMedia,
}: ProductMediaManagerProps) {
  const [mediaList, setMediaList] =
    useState<AdminProductMediaPlacement[]>(initialMedia);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Detach confirmation state for hero
  const [detachConfirmAsset, setDetachConfirmAsset] =
    useState<AdminProductMediaPlacement | null>(null);

  // Trigger refs for focus restoration
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);
  const uploadTriggerRef = useRef<HTMLButtonElement>(null);
  const detachTriggerRef = useRef<HTMLButtonElement>(null);

  // Managed media list
  const managedMedia = mediaList.filter(
    (m) => m.asset.provider !== "legacy_public",
  );

  // Identify primary hero
  const heroMedia =
    managedMedia.find((m) => m.isHero) || managedMedia[0] || null;
  const galleryMedia = managedMedia.filter((m) => m.id !== heroMedia?.id);

  // Helper to refresh only media state without re-rendering parent form
  const refreshMedia = async () => {
    try {
      const res = await getProductMediaV1Action(productId);
      if (res.success && res.media) {
        setMediaList(res.media);
      }
    } catch {
      // Quiet failover
    }
  };

  // Actions
  const handleSetHero = async (assetId: string) => {
    setIsPending(true);
    setStatusMessage(null);
    try {
      const res = await setProductMediaHeroAction(productId, assetId);
      if (res.success) {
        await refreshMedia();
        setStatusMessage({ type: "success", text: "Hero image updated." });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to set hero image.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error while setting hero.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleDetachClick = (item: AdminProductMediaPlacement) => {
    // Active product last-media check
    if (productStatus === "active" && managedMedia.length <= 1) {
      setStatusMessage({
        type: "error",
        text: "Active products must retain at least one managed image. Attach a replacement before removing this asset.",
      });
      return;
    }

    // If it's the hero, ask for confirmation
    if (item.isHero) {
      setDetachConfirmAsset(item);
    } else {
      executeDetach(item.mediaAssetId);
    }
  };

  const executeDetach = async (assetId: string) => {
    setIsPending(true);
    setStatusMessage(null);
    setDetachConfirmAsset(null);
    try {
      const res = await detachMediaAssetFromProductAction(productId, assetId);
      if (res.success) {
        await refreshMedia();
        setStatusMessage({
          type: "success",
          text: "Media removed from product.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to remove media.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error while removing media.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleMove = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryMedia.length) return;

    // Create new gallery order
    const newGallery = [...galleryMedia];
    const [moved] = newGallery.splice(index, 1);
    newGallery.splice(targetIndex, 0, moved);

    // Reconstruct full managed order: hero stays at position 0, gallery follows
    const newManaged = heroMedia ? [heroMedia, ...newGallery] : newGallery;
    const mediaAssetIds = newManaged.map((m) => m.mediaAssetId);

    setIsPending(true);
    setStatusMessage(null);
    try {
      const res = await reorderProductMediaActionV1(productId, mediaAssetIds);
      if (res.success) {
        await refreshMedia();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to reorder gallery.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error while reordering.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleUploadSuccess = async (newAssetId: string) => {
    setIsPending(true);
    setStatusMessage(null);
    try {
      // Step 2 of Product Edit intake: explicitly attach finalized asset
      const res = await attachMediaAssetToProductAction(productId, newAssetId);
      if (res.success) {
        await refreshMedia();
        setStatusMessage({
          type: "success",
          text: "New asset uploaded and attached.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Asset created but failed to attach to product.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Failed to attach newly uploaded asset.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div id="product-media-section" className="bg-[#fffefc] border border-[#cfc4b6] rounded-[2px] p-6 sm:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#cfc4b6] pb-5">
        <div>
          <span className="admin-eyebrow">Visual Representation</span>
          <h3 className="admin-title text-2xl mt-0.5">Product Media</h3>
          <p className="admin-subtitle text-xs sm:text-sm mt-1 max-w-xl">
            The imagery currently presented across the storefront catalog, gallery, and checkout.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            ref={pickerTriggerRef}
            type="button"
            disabled={isPending}
            onClick={() => setIsPickerOpen(true)}
            className="admin-btn admin-btn-secondary text-xs"
          >
            Select from Library
          </button>
          <button
            ref={uploadTriggerRef}
            type="button"
            disabled={isPending}
            onClick={() => setIsUploadOpen(true)}
            className="admin-btn admin-btn-primary text-xs"
          >
            + Upload New
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3 text-xs rounded-[2px] border ${
            statusMessage.type === "success"
              ? "bg-[#edf6ee] border-[#b8dfbc] text-[#24632b]"
              : "bg-[#faefef] border-[#deb8b8] text-[#8f2d2d]"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Empty State */}
      {managedMedia.length === 0 ? (
        <div className="py-16 px-4 text-center bg-[#fbf9f5] border border-dashed border-[#cfc4b6] rounded-[2px]">
          <span className="admin-eyebrow">No Imagery</span>
          <h4 className="admin-title text-xl mt-1 mb-2">No product imagery yet</h4>
          <p className="admin-subtitle text-xs max-w-md mx-auto mb-6">
            Select an existing stone master from the library or upload a new asset to serve as the hero.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="admin-btn admin-btn-secondary text-xs"
            >
              Select from Library
            </button>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="admin-btn admin-btn-primary text-xs"
            >
              Upload New Asset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* HERO SECTION */}
          {heroMedia && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-[#30261f]">
                    Hero Image
                  </h4>
                  <span className="text-[10px] text-[#706257]">
                    (Authoritative catalog hero)
                  </span>
                </div>
                <span className="admin-badge admin-badge--hero text-[8px] py-0.5 px-2">
                  Active Hero
                </span>
              </div>

              <div className="bg-[#fbf9f5] border border-[#cfc4b6] p-4 sm:p-6 rounded-[2px] flex flex-col md:flex-row items-start gap-6">
                {/* Large Canvas */}
                <div className="w-full md:w-56 flex-shrink-0">
                  <div className="admin-stone-frame border border-[#cfc4b6] rounded-[2px] shadow-sm">
                    {heroMedia.asset.publicUrl ? (
                      <Image
                        src={heroMedia.asset.publicUrl}
                        alt={heroMedia.altText || heroMedia.asset.filename || "Hero image"}
                        fill
                        sizes="240px"
                        className="object-contain p-4"
                        placeholder={heroMedia.asset.lqip ? "blur" : "empty"}
                        blurDataURL={heroMedia.asset.lqip || undefined}
                      />
                    ) : (
                      <div className="text-xs text-[#706257]">No preview</div>
                    )}
                  </div>
                </div>

                {/* Hero Details & Placement Alt Text */}
                <div className="flex-1 min-w-0 space-y-4 w-full">
                  <div>
                    <h5
                      className="text-sm font-semibold text-[#30261f] truncate"
                      title={heroMedia.asset.filename || "Untitled"}
                    >
                      {heroMedia.asset.filename || "Untitled"}
                    </h5>
                    <div className="flex items-center gap-3 text-xs text-[#706257] mt-1">
                      <span className="admin-mono">
                        {heroMedia.asset.width && heroMedia.asset.height
                          ? `${heroMedia.asset.width} × ${heroMedia.asset.height} px`
                          : "Dimensions unknown"}
                      </span>
                      {heroMedia.asset.fileSize && (
                        <span>
                          &bull; {(heroMedia.asset.fileSize / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alt Text Placement Input */}
                  <AltTextEditor
                    productId={productId}
                    mediaAssetId={heroMedia.mediaAssetId}
                    initialAlt={heroMedia.altText || ""}
                  />

                  <div className="pt-2 flex items-center justify-between border-t border-[#e9e2d6]">
                    <span className="text-[11px] text-[#8c7e73]">
                      Primary store display and search thumbnail
                    </span>
                    <button
                      ref={detachTriggerRef}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDetachClick(heroMedia)}
                      className="text-xs text-[#8f2d2d] hover:text-[#5f1d1d] underline py-1 transition-colors"
                    >
                      Remove from Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GALLERY SECTION */}
          {galleryMedia.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#cfc4b6]">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-[#30261f]">
                  Gallery Images ({galleryMedia.length})
                </h4>
                <span className="text-[11px] text-[#706257]">
                  Presented sequentially in the product detail view
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryMedia.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-[#fbf9f5] border border-[#cfc4b6] p-3 rounded-[2px] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Thumbnail Frame */}
                      <div className="admin-stone-frame border border-[#cfc4b6] rounded-[2px] mb-2">
                        {item.asset.publicUrl ? (
                          <Image
                            src={item.asset.publicUrl}
                            alt={item.altText || item.asset.filename || "Gallery thumbnail"}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-contain p-2"
                            placeholder={item.asset.lqip ? "blur" : "empty"}
                            blurDataURL={item.asset.lqip || undefined}
                          />
                        ) : (
                          <div className="text-xs text-[#706257]">No preview</div>
                        )}
                      </div>

                      {/* Info */}
                      <p
                        className="text-xs font-medium text-[#30261f] truncate"
                        title={item.asset.filename || "Untitled"}
                      >
                        {item.asset.filename || "Untitled"}
                      </p>
                      <p className="admin-mono text-[10px] text-[#706257] mt-0.5">
                        {item.asset.width && item.asset.height
                          ? `${item.asset.width} × ${item.asset.height}`
                          : "—"}
                      </p>
                    </div>

                    {/* Alt Text Editor */}
                    <AltTextEditor
                      productId={productId}
                      mediaAssetId={item.mediaAssetId}
                      initialAlt={item.altText || ""}
                      compact
                    />

                    {/* Gallery Card Controls */}
                    <div className="pt-2 border-t border-[#e9e2d6] flex items-center justify-between text-xs">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || isPending}
                          onClick={() => handleMove(index, "left")}
                          aria-label={`Move ${item.asset.filename || "image"} left`}
                          className="admin-btn admin-btn-secondary text-[10px] py-1 px-2 disabled:opacity-30"
                          title="Move earlier"
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          disabled={index === galleryMedia.length - 1 || isPending}
                          onClick={() => handleMove(index, "right")}
                          aria-label={`Move ${item.asset.filename || "image"} right`}
                          className="admin-btn admin-btn-secondary text-[10px] py-1 px-2 disabled:opacity-30"
                          title="Move later"
                        >
                          &rarr;
                        </button>
                      </div>

                      {/* Make Hero & Detach */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSetHero(item.mediaAssetId)}
                          className="text-[11px] text-[#30261f] hover:underline py-1"
                        >
                          Make Hero
                        </button>
                        <span className="text-[#cfc4b6]">&bull;</span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDetachClick(item)}
                          className="text-[11px] text-[#8f2d2d] hover:text-[#5f1d1d] underline py-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Select from Library Picker Dialog */}
      <ProductMediaLibraryPicker
        productId={productId}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        attachedAssetIds={mediaList.map((m) => m.mediaAssetId)}
        onAttachSuccess={refreshMedia}
        triggerRef={pickerTriggerRef}
      />

      {/* Upload New Asset Modal */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        triggerRef={uploadTriggerRef}
      />

      {/* Hero Detach Confirmation Dialog */}
      {detachConfirmAsset && (
        <DialogPrimitive.Root
          open={Boolean(detachConfirmAsset)}
          onOpenChange={(open) => {
            if (!open) setDetachConfirmAsset(null);
          }}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="admin-drawer-backdrop" />
            <DialogPrimitive.Content className="admin-modal-panel p-6 outline-none max-w-md">
              <DialogPrimitive.Title asChild>
                <h3 className="admin-title text-xl text-[#30261f]">
                  Remove Hero Image?
                </h3>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-[#706257] mt-2">
                This image is currently the primary hero for this product. If removed,
                the next available gallery image will automatically become the new hero.
              </DialogPrimitive.Description>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#cfc4b6]">
                <button
                  type="button"
                  onClick={() => setDetachConfirmAsset(null)}
                  className="admin-btn admin-btn-quiet text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDetach(detachConfirmAsset.mediaAssetId)}
                  className="admin-btn admin-btn-danger text-xs"
                >
                  Remove Hero
                </button>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </div>
  );
}

/**
 * Inline Alt Text Editor with quiet Save / Saved indicator
 */
function AltTextEditor({
  productId,
  mediaAssetId,
  initialAlt,
  compact = false,
}: {
  productId: string;
  mediaAssetId: string;
  initialAlt: string;
  compact?: boolean;
}) {
  const [altText, setAltText] = useState(initialAlt);
  const [lastSaved, setLastSaved] = useState(initialAlt);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const handleSave = async () => {
    if (altText === lastSaved) return;
    setStatus("saving");
    try {
      const res = await updateProductMediaAltTextActionV1(
        productId,
        mediaAssetId,
        altText.trim() || null,
      );
      if (res.success) {
        setLastSaved(altText);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <label
          htmlFor={`alt-${mediaAssetId}`}
          className="text-[#706257] font-medium"
        >
          Alt Text
        </label>
        {status === "saving" && (
          <span className="text-[#706257]">Saving...</span>
        )}
        {status === "saved" && (
          <span className="text-[#24632b] font-medium">Saved</span>
        )}
        {status === "error" && (
          <span className="text-[#8f2d2d]">Failed to save</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`alt-${mediaAssetId}`}
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Descriptive placement alt text..."
          className={`admin-input w-full ${compact ? "text-[11px] py-1 px-2" : "text-xs"}`}
        />
        {altText !== lastSaved && (
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="admin-btn admin-btn-secondary text-[10px] py-1 px-2 whitespace-nowrap"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
