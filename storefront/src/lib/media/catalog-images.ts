import manifestData from "./manifest.json";
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

const manifest = manifestData as Record<
  string,
  {
    slug: string;
    hash: string;
    dominantColor: string;
    lqip: string;
    mainUrl: string;
    variants: ResponsiveVariants;
  }
>;

/**
 * Resolves pre-generated delivery assets from the automated ingestion manifest.
 * Fallback to standard Spree thumbnail_url when manifest item is missing.
 */
export function getProductMedia(
  slug?: string | null,
  fallbackUrl?: string | null,
): ProductMediaMetadata {
  if (slug && manifest[slug]) {
    const item = manifest[slug];
    return {
      mainUrl: item.mainUrl,
      dominantColor: item.dominantColor,
      lqip: item.lqip,
      hash: item.hash,
      variants: item.variants,
    };
  }

  return {
    mainUrl: fallbackUrl || "",
    dominantColor: "#f5f5f5",
    lqip: undefined,
    hash: null,
    variants: undefined,
  };
}
