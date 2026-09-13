"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  deleteProductMediaAction,
  finalizeProductMediaUploadAction,
  reorderProductMediaAction,
  requestProductMediaUploadAction,
  setHeroMediaAction,
  updateMediaAltTextAction,
} from "@/lib/actions/admin-media";
import { getStoragePublicUrl } from "@/lib/media/delivery";
import type { DbProductImageRow } from "@/lib/db/media";

interface ProductMediaManagerProps {
  productId: string;
  initialMedia: DbProductImageRow[];
}

export function ProductMediaManager({
  productId,
  initialMedia,
}: ProductMediaManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mediaList, setMediaList] = useState<DbProductImageRow[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [altEditing, setAltEditing] = useState<Record<string, string>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // 1. Request signed upload authorization from server
      const reqRes = await requestProductMediaUploadAction(
        productId,
        file.name,
        file.type,
        file.size,
      );

      if (!reqRes.success || !reqRes.signedUrl || !reqRes.storagePath || !reqRes.mediaId) {
        throw new Error(reqRes.error || "Failed to authorize upload");
      }

      // 2. Direct browser upload to signed URL
      const uploadRes = await fetch(reqRes.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      // 3. Finalize upload on server (Sharp validation, LQIP, metadata DB insert)
      const finRes = await finalizeProductMediaUploadAction({
        productId,
        mediaId: reqRes.mediaId,
        storagePath: reqRes.storagePath,
        originalFilename: file.name,
        mimeType: file.type,
      });

      if (!finRes.success) {
        throw new Error(finRes.error || "Failed to finalize image upload");
      }

      setSuccess("Image uploaded successfully.");
      e.target.value = "";
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetHero = (mediaId: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await setHeroMediaAction(productId, mediaId);
      if (!res.success) {
        setError(res.error || "Failed to set hero image.");
      } else {
        setSuccess("Hero image updated.");
        setMediaList((prev) =>
          prev.map((m) => ({ ...m, is_hero: m.id === mediaId })),
        );
        router.refresh();
      }
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    setError(null);
    const newList = [...mediaList];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);
    setMediaList(newList);

    startTransition(async () => {
      const ids = newList.map((m) => m.id);
      const res = await reorderProductMediaAction(productId, ids);
      if (!res.success) {
        setError(res.error || "Failed to reorder images.");
        setMediaList(initialMedia);
      } else {
        router.refresh();
      }
    });
  };

  const handleSaveAlt = (mediaId: string) => {
    const alt = altEditing[mediaId];
    if (alt === undefined) return;

    setError(null);
    startTransition(async () => {
      const res = await updateMediaAltTextAction(productId, mediaId, alt);
      if (!res.success) {
        setError(res.error || "Failed to update alt text.");
      } else {
        setSuccess("Alt text saved.");
        setMediaList((prev) =>
          prev.map((m) => (m.id === mediaId ? { ...m, alt_text: alt } : m)),
        );
        router.refresh();
      }
    });
  };

  const handleDelete = (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteProductMediaAction(productId, mediaId);
      if (!res.success) {
        setError(res.error || "Failed to delete image.");
      } else {
        setSuccess("Image deleted.");
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Product Media</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage product photography, hero banner, display order, and alt text.
          </p>
        </div>
        <label className="relative inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 cursor-pointer disabled:opacity-50">
          <span>{uploading ? "Uploading..." : "Upload Image"}</span>
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading || isPending}
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-xs bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {mediaList.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-md">
          <p className="text-xs text-gray-500">No media uploaded yet for this product.</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Accepts JPEG, PNG, WebP, and AVIF up to 10 MB.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mediaList.map((media, idx) => {
            const url = getStoragePublicUrl(media.storage_path);
            const currentAlt =
              altEditing[media.id] !== undefined
                ? altEditing[media.id]
                : media.alt_text || "";

            return (
              <div
                key={media.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Image Preview */}
                <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image
                    src={url}
                    alt={media.alt_text || "Product image"}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {media.is_hero && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black text-white text-[9px] font-semibold rounded uppercase tracking-wider">
                      Hero
                    </span>
                  )}
                </div>

                {/* Details & Alt Edit */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-mono text-gray-400">#{idx + 1}</span>
                    {media.width && media.height && (
                      <span>
                        {media.width} &times; {media.height} px
                      </span>
                    )}
                    {media.dominant_color && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                          style={{ backgroundColor: media.dominant_color }}
                        />
                        <span className="font-mono">{media.dominant_color}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded w-full max-w-sm focus:outline-none focus:border-black"
                      placeholder="Image alt description"
                      value={currentAlt}
                      onChange={(e) =>
                        setAltEditing({ ...altEditing, [media.id]: e.target.value })
                      }
                    />
                    {altEditing[media.id] !== undefined &&
                      altEditing[media.id] !== (media.alt_text || "") && (
                        <button
                          type="button"
                          onClick={() => handleSaveAlt(media.id)}
                          disabled={isPending}
                          className="text-xs px-2.5 py-1.5 bg-gray-900 text-white rounded hover:bg-black font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!media.is_hero && (
                    <button
                      type="button"
                      onClick={() => handleSetHero(media.id)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Make Hero
                    </button>
                  )}

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0 || isPending}
                      className="text-[10px] px-2 py-0.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                      title="Move up"
                    >
                      &uarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === mediaList.length - 1 || isPending}
                      className="text-[10px] px-2 py-0.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                      title="Move down"
                    >
                      &darr;
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(media.id)}
                    disabled={isPending}
                    className="text-xs px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded font-medium disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
