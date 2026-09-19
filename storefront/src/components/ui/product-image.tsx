"use client";

import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { generateSrcSet, type ResponsiveVariantsSchema } from "@/lib/media/delivery";

const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23ffffff'/%3E%3C/svg%3E";

export type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  iconClassName?: string;
  icon?: LucideIcon;
  variants?: ResponsiveVariantsSchema | null;
};

export function ProductImage({
  src,
  iconClassName = "w-8 h-8",
  icon: Icon = ImageIcon,
  onError,
  fetchPriority,
  placeholder,
  blurDataURL,
  variants,
  ...rest
}: ProductImageProps): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white text-gray-300">
        <Icon className={iconClassName} />
      </div>
    );
  }

  const avifSrcSet = variants ? generateSrcSet(variants, "avif") : null;
  const webpSrcSet = variants ? generateSrcSet(variants, "webp") : null;

  if (avifSrcSet || webpSrcSet) {
    const isPriority =
      Boolean(rest.priority) ||
      fetchPriority === "high" ||
      rest.loading === "eager";
    const fallbackSrc =
      variants?.["1200"]?.webp ||
      variants?.["960"]?.webp ||
      variants?.["640"]?.webp ||
      src;

    return (
      <picture className={rest.fill ? "absolute inset-0 block w-full h-full" : undefined}>
        {avifSrcSet && (
          <source
            type="image/avif"
            srcSet={avifSrcSet}
            sizes={rest.sizes}
          />
        )}
        {webpSrcSet && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
            sizes={rest.sizes}
          />
        )}
        <img
          src={fallbackSrc}
          alt={rest.alt || ""}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={fetchPriority ?? (isPriority ? "high" : undefined)}
          decoding="async"
          className={rest.className}
          style={{
            objectFit: rest.className?.includes("object-contain") ? "contain" : "cover",
            width: "100%",
            height: "100%",
            ...(rest.style as React.CSSProperties),
          }}
          onError={(e) => {
            setHasError(true);
            onError?.(e as any);
          }}
        />
      </picture>
    );
  }

  return (
    <Image
      src={src}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      fetchPriority={fetchPriority}
      loading={fetchPriority === "high" ? "eager" : undefined}
      priority={rest.priority ?? fetchPriority === "high"}
      placeholder={placeholder ?? "blur"}
      blurDataURL={blurDataURL ?? DEFAULT_BLUR_DATA_URL}
      {...rest}
    />
  );
}

