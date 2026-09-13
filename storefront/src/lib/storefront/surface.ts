import {
  MIRZA_CART_TOKEN_COOKIE,
  MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
} from "./legacy-cookie-migration";

/**
 * A storefront surface is a distinct sales context.
 * The DTC surface is the public storefront; the wholesale surface is the gated B2B portal.
 *
 * The surface selects:
 * - which cart cookies hold the surface's cart (coexisting DTC vs wholesale carts)
 * - which cache tags/keys segment cached reads
 */
export type Surface = "dtc" | "wholesale";

export const DEFAULT_SURFACE: Surface = "dtc";

/** All storefront surfaces. */
export const SURFACES: readonly Surface[] = ["dtc", "wholesale"];

/**
 * Cart cookie base name for a surface. The cart-id cookie is derived by
 * appending `_id` (see cookies.ts). Wholesale gets its own pair so the two
 * carts coexist.
 */
export function cartCookieBaseName(surface: Surface): string {
  return surface === "wholesale"
    ? MIRZA_WHOLESALE_CART_TOKEN_COOKIE
    : MIRZA_CART_TOKEN_COOKIE;
}

/**
 * Suffix appended to cache tags/keys so DTC and wholesale caches are disjoint.
 * DTC keeps the unsuffixed tags to preserve existing cache entries.
 */
export function cacheTagSuffix(surface: Surface): string {
  return surface === "wholesale" ? "-wholesale" : "";
}
