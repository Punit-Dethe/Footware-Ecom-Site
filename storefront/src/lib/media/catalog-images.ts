import type { ProductMedia } from "./types";

export type { ProductMedia };

export interface ResponsiveVariants {
  [width: string]: {
    avif?: string;
    webp?: string;
  };
}

export interface ProductMediaMetadata extends ProductMedia {
  hash: string | null;
}

/**
 * Resolves delivery assets for a product.
 * Fallback to standard thumbnail_url when media is missing.
 */
export function getProductMedia(
  _slug?: string | null,
  fallbackUrl?: string | null,
): ProductMediaMetadata {
  return {
    mainUrl: fallbackUrl || "/placeholder.svg",
    dominantColor: "#f5f5f5",
    lqip: undefined,
    hash: null,
    variants: undefined,
  };
}
