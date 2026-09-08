"use client";

import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const DEFAULT_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  iconClassName?: string;
  icon?: LucideIcon;
};

export function ProductImage({
  src,
  iconClassName = "w-8 h-8",
  icon: Icon = ImageIcon,
  onError,
  fetchPriority,
  placeholder,
  blurDataURL,
  ...rest
}: ProductImageProps): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300">
        <Icon className={iconClassName} />
      </div>
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
