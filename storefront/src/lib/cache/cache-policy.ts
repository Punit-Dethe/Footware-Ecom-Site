/**
 * Canonical Data Freshness Classes and Cache-Control Policies.
 *
 * Implements Phase P0.4 from the Advanced Optimization Roadmap.
 * Centralizes cache-control directives to guarantee 100% parity across
 * Next.js Edge Middleware and next.config.ts route-level headers.
 */

export const CACHE_POLICIES = {
  /**
   * Class A: Extremely Stable Catalog (Homepage, Category pages)
   * Edge TTL: 24 hours, Stale-While-Revalidate: 7 days.
   */
  STABLE_CATALOG:
    "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",

  /**
   * Class B: Active Catalog Content (Product listing, Product Detail Pages)
   * Edge TTL: 1 hour, Stale-While-Revalidate: 24 hours.
   */
  CATALOG_CONTENT:
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",

  /**
   * Class D: Volatile & Private (Cart, Checkout, User Account)
   * Zero browser or CDN cache; strictly private and must revalidate.
   */
  PRIVATE_SESSION:
    "private, no-cache, no-store, max-age=0, must-revalidate",

  /**
   * Class E: Immutable Static Assets (Content-addressed JS, CSS, Fonts)
   * Max age 1 year; immutable.
   */
  IMMUTABLE_ASSET:
    "public, max-age=31536000, immutable",
} as const;

export type CachePolicyClass = keyof typeof CACHE_POLICIES;

/**
 * Normalizes a pathname by stripping localized market prefixes (e.g. /us/en, /in/en).
 */
export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}\/[a-z]{2,3}(?:-[a-z0-9]{2,8})*/i, "");
}

/**
 * Resolves the canonical Cache-Control header for a given pathname.
 *
 * @param pathname The request pathname (with or without localized prefix).
 * @returns The appropriate Cache-Control header string.
 */
export function resolveRouteCachePolicy(pathname: string): string {
  const cleanPath = stripLocalePrefix(pathname);

  // Class D: Volatile & Private
  if (
    cleanPath.startsWith("/cart") ||
    cleanPath.startsWith("/checkout") ||
    cleanPath.startsWith("/account")
  ) {
    return CACHE_POLICIES.PRIVATE_SESSION;
  }

  // Class A: Extremely Stable (Homepage, Category pages)
  if (
    cleanPath === "" ||
    cleanPath === "/" ||
    cleanPath.startsWith("/c/")
  ) {
    return CACHE_POLICIES.STABLE_CATALOG;
  }

  // Class B: Catalog Content (Product listing, PDPs, Wholesale)
  if (
    cleanPath.startsWith("/products") ||
    cleanPath.startsWith("/wholesale") ||
    cleanPath.startsWith("/policies")
  ) {
    return CACHE_POLICIES.CATALOG_CONTENT;
  }

  // Default to Catalog Content freshness for other public storefront pages
  return CACHE_POLICIES.CATALOG_CONTENT;
}

/**
 * Generates Next.js route-level header objects for next.config.ts.
 */
export function generateNextConfigCacheHeaders() {
  return [
    // Class A: Extremely Stable
    {
      source: "/:country/:locale",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.STABLE_CATALOG,
        },
      ],
    },
    {
      source: "/:country/:locale/c/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.STABLE_CATALOG,
        },
      ],
    },
    // Class B: Catalog Content
    {
      source: "/:country/:locale/products",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.CATALOG_CONTENT,
        },
      ],
    },
    {
      source: "/:country/:locale/products/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.CATALOG_CONTENT,
        },
      ],
    },
    {
      source: "/:country/:locale/policies/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.CATALOG_CONTENT,
        },
      ],
    },
    {
      source: "/:country/:locale/wholesale/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.CATALOG_CONTENT,
        },
      ],
    },
    // Class D: Volatile & Private
    {
      source: "/:country/:locale/cart",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.PRIVATE_SESSION,
        },
      ],
    },
    {
      source: "/:country/:locale/checkout/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.PRIVATE_SESSION,
        },
      ],
    },
    {
      source: "/:country/:locale/account/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.PRIVATE_SESSION,
        },
      ],
    },
    // Class E: Immutable Pre-Generated Hashed Product Media
    {
      source: "/products/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: CACHE_POLICIES.IMMUTABLE_ASSET,
        },
      ],
    },
  ];
}
