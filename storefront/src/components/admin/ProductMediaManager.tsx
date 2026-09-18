"use client";

import Image from "next/image";
import { getStoragePublicUrl } from "@/lib/media/delivery";
import type { DbProductImageRow } from "@/lib/db/media";

interface ProductMediaManagerProps {
  productId: string;
  initialMedia: DbProductImageRow[];
}

export function ProductMediaManager({
  productId: _productId,
  initialMedia,
}: ProductMediaManagerProps) {
  const mediaList = initialMedia;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Migration Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Media Management Notice
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Media management is being migrated to Media Library. Image modifications are temporarily disabled while storefront media reads are cut over to Media Contract v1.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Product Media</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage product photography, hero banner, display order, and alt text.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
          Upload Disabled
        </span>
      </div>

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
            const currentAlt = media.alt_text || "";

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

                {/* Details & Alt View */}
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
                      readOnly
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded w-full max-w-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                      placeholder="Image alt description"
                      value={currentAlt}
                    />
                  </div>
                </div>

                {/* Actions Guard: Read-only status indicator */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 font-mono px-2 py-1 bg-gray-50 border border-gray-100 rounded">
                    {media.is_hero ? "Hero Image" : "Gallery Image"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
