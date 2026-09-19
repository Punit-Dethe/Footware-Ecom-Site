"use client";

import { ZoomIn } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import type { Media } from "@/types/commerce";

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_VERTICAL_PX = 75;

/** Tiny 10×10 neutral gray PNG used as a blur placeholder while images load. */
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIElEQVQYV2P4////MwwMDAxMDAwMDGQJMJCvkGwNZCsEAGebBwVss9lRAAAAAElFTkSuQmCC";

/** Lazy-loaded lightbox — only pulled into the bundle when a user zooms. */
const LazyMediaLightbox = dynamic(
  () =>
    import("@/components/products/MediaLightbox").then((mod) => ({
      default: mod.MediaLightbox,
    })),
  {
    ssr: false,
    // Minimal fullscreen overlay so the zoom click gives immediate
    // feedback on slow networks while the chunk downloads.
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/90" aria-hidden="true" />
    ),
  },
);

interface MediaGalleryProps {
  images: Media[];
  productName: string;
  activeIndex?: number | null;
  editorial?: boolean;
}

/** Prefer pre-sized media URLs over the full-resolution original,
 * so the Next.js image optimizer doesn't have to fetch the source file. */
function getMainImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return (
    media.xlarge_url ||
    media.large_url ||
    media.original_url ||
    (media as unknown as { url?: string }).url ||
    null
  );
}

function getThumbImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return (
    media.small_url ||
    media.mini_url ||
    media.original_url ||
    (media as unknown as { url?: string }).url ||
    null
  );
}

export function MediaGallery(props: MediaGalleryProps) {
  // Reset internal state when the parent changes activeIndex by rekeying.
  // Avoids the useEffect-to-sync-prop antipattern.
  return <MediaGalleryInner key={props.activeIndex ?? "default"} {...props} />;
}

function MediaGalleryInner({
  images,
  productName,
  activeIndex,
  editorial = false,
}: MediaGalleryProps) {
  const t = useTranslations("products");
  const [selectedIndex, setSelectedIndex] = useState(activeIndex ?? 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mainImageErrorUrl, setMainImageErrorUrl] = useState<string | null>(
    null,
  );

  const safeIndex = Math.max(0, Math.min(selectedIndex, images.length - 1));

  // Horizontal swipe on the main image navigates between media. When a
  // swipe is detected we suppress the synthetic click so the lightbox
  // doesn't open from the same gesture.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressClickRef.current = false;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || images.length <= 1) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (
        Math.abs(dx) < SWIPE_THRESHOLD_PX ||
        Math.abs(dy) > SWIPE_MAX_VERTICAL_PX
      ) {
        return;
      }
      suppressClickRef.current = true;
      const nextIndex =
        dx < 0
          ? (safeIndex + 1) % images.length
          : (safeIndex - 1 + images.length) % images.length;
      setSelectedIndex(nextIndex);
      setMainImageErrorUrl(null);
    },
    [images.length, safeIndex],
  );

  if (images.length === 0) {
    return (
      <div
        className={`relative aspect-square overflow-hidden ${editorial ? "bg-white" : "bg-gray-100 rounded-xl"}`}
      >
        <ProductImage
          src={null}
          alt={productName}
          fill
          iconClassName="w-24 h-24"
        />
      </div>
    );
  }

  const selectImage = (index: number) => {
    setSelectedIndex(index);
    setMainImageErrorUrl(null);
  };

  const selectedImage = images[safeIndex];
  const mainImageUrl = getMainImageUrl(selectedImage);
  const showMainImage = mainImageUrl && mainImageErrorUrl !== mainImageUrl;

  return (
    <div
      className={`media-gallery${editorial ? " media-gallery--editorial" : ""}${images.length === 1 ? " media-gallery--single" : ""}`}
    >
      {/* Main Image */}
      <button
        type="button"
        className={`media-gallery__main relative aspect-square overflow-hidden cursor-zoom-in w-full touch-pan-y ${editorial ? "bg-white" : "bg-gray-100 rounded-xl"}`}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (showMainImage) setIsZoomed(true);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={t("openImageZoom")}
        disabled={!showMainImage}
      >
        <ProductImage
          key={safeIndex}
          src={mainImageUrl}
          variants={selectedImage?.variants}
          alt={selectedImage?.alt || productName}
          fill
          className={editorial ? "object-contain" : "object-cover"}
          fetchPriority="high"
          loading="eager"
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          iconClassName="w-24 h-24"
          onError={() => mainImageUrl && setMainImageErrorUrl(mainImageUrl)}
        />
        {/* Zoom hint */}
        {showMainImage && (
          <div className="media-gallery__zoom absolute bottom-4 right-4 bg-white/80 px-3 py-1.5 text-sm text-gray-600 flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
            <span>{t("clickToZoom")}</span>
          </div>
        )}
      </button>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="media-gallery__thumbs flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = getThumbImageUrl(image);
            return (
              <button
                type="button"
                key={image.id}
                onClick={() => selectImage(index)}
                aria-label={`${productName} ${index + 1}`}
                aria-pressed={index === safeIndex}
                className={`media-gallery__thumb relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${editorial ? "bg-white" : "bg-gray-100 rounded-xl"} ${
                  index === safeIndex
                    ? "border-gray-600"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <ProductImage
                  src={thumbUrl}
                  variants={image.variants}
                  alt={image.alt || `${productName} ${index + 1}`}
                  fill
                  className={editorial ? "object-contain" : "object-cover"}
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox (lazy) */}
      {isZoomed && showMainImage && (
        <LazyMediaLightbox
          images={images}
          activeIndex={safeIndex}
          productName={productName}
          onClose={() => setIsZoomed(false)}
          onNavigate={selectImage}
        />
      )}
    </div>
  );
}
