export const PLACEHOLDER_IMAGE_URL = "/placeholder.svg";

/**
 * Converts a storage object path (e.g. "products/.../original.webp")
 * into a fully qualified public Supabase CDN URL.
 * Gracefully handles already absolute URLs or falls back to /placeholder.svg.
 */
export function getStoragePublicUrl(storagePath?: string | null): string {
  if (!storagePath) {
    return PLACEHOLDER_IMAGE_URL;
  }

  // If already absolute or root-relative URL, return as-is
  if (
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("/")
  ) {
    return storagePath;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://hkncfdsvgjopkujmmxem.supabase.co";

  const cleanBase = supabaseUrl.replace(/\/+$/, "");
  const cleanPath = storagePath.replace(/^\/+/, "");

  return `${cleanBase}/storage/v1/object/public/product-media/${cleanPath}`;
}

export interface ResponsiveVariantsSchema {
  [width: string]: {
    avif?: string;
    webp?: string;
  };
}

/**
 * Converts processed_variants JSON object with storage paths into public CDN URLs.
 */
export function resolveResponsiveVariants(
  variants?: ResponsiveVariantsSchema | null,
): ResponsiveVariantsSchema | undefined {
  if (!variants || typeof variants !== "object") {
    return undefined;
  }

  const resolved: ResponsiveVariantsSchema = {};
  for (const [width, formats] of Object.entries(variants)) {
    if (!formats || typeof formats !== "object") continue;
    resolved[width] = {
      ...(formats.avif ? { avif: getStoragePublicUrl(formats.avif) } : {}),
      ...(formats.webp ? { webp: getStoragePublicUrl(formats.webp) } : {}),
    };
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

/**
 * Builds responsive srcset string from variant map for given format.
 */
export function generateSrcSet(
  variants?: ResponsiveVariantsSchema | null,
  format: "webp" | "avif" = "webp",
): string | null {
  if (!variants || typeof variants !== "object") return null;

  const entries: { width: number; url: string }[] = [];
  for (const [wStr, formats] of Object.entries(variants)) {
    const width = parseInt(wStr, 10);
    const url = formats?.[format];
    if (url && !Number.isNaN(width)) {
      entries.push({ width, url });
    }
  }

  if (entries.length === 0) return null;

  entries.sort((a, b) => a.width - b.width);
  return entries.map((e) => `${e.url} ${e.width}w`).join(", ");
}

