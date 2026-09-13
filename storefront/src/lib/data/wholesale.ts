"use server";

import {
  getAccessToken,
  isWholesaleEnabled,
} from "@/lib/spree";
import type { Channel, ProductListParams } from "@/types/commerce";
import {
  getProduct as getProductBySurface,
  getProductFilters as getProductFiltersBySurface,
  getProducts as getProductsBySurface,
} from "./products";
import { searchCatalogVariants } from "@/lib/catalog/catalog-repository";
import { getVariantByIdOrSku } from "@/lib/db/catalog";

/**
 * Fetch the wholesale channel's resolved configuration.
 * Returns null when the wholesale addon is off.
 */
export async function getWholesaleChannel(): Promise<Channel | null> {
  if (!isWholesaleEnabled()) return null;

  return {
    id: "chn_wholesale",
    code: "wholesale",
    name: "Mirza Wholesale",
    currency: "USD",
    default_locale: "en",
    supported_locales: ["en"],
  };
}

// --- Surface-bound product fetchers for the wholesale PLP/PDP ---
export async function getWholesaleProducts(params?: ProductListParams) {
  return getProductsBySurface(params, "wholesale");
}

export async function getWholesaleProductFilters(
  params?: Record<string, unknown>,
) {
  return getProductFiltersBySurface(params, "wholesale");
}

export async function getWholesaleProduct(
  slugOrId: string,
  params?: { expand?: string[] },
) {
  return getProductBySurface(slugOrId, params, "wholesale");
}

/** A selectable variant in the quick-order autocomplete. */
export interface WholesaleVariantSuggestion {
  variantId: string;
  productName: string;
  optionsText?: string;
  sku: string;
  displayPrice?: string;
  purchasable: boolean;
}

/**
 * Search the wholesale catalog for variants matching a free-text query (product
 * name or SKU), for the quick-order autocomplete. Flattens products to variants
 * so buyers can pick the exact colour/size rather than just the product.
 * Requires the customer JWT — the channel 401s guests.
 *
 * Uses the first-party B6A cached catalog snapshot with 0 database queries when warm.
 */
export async function searchWholesaleVariants(
  query: string,
  limit = 8,
): Promise<WholesaleVariantSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const token = await getAccessToken();
  if (!token) return [];

  const results = await searchCatalogVariants(trimmed, limit);
  return results.map((r) => ({
    variantId: r.variantId,
    productName: r.productName,
    optionsText: r.optionsText,
    sku: r.sku,
    displayPrice: r.displayPrice,
    purchasable: r.purchasable,
  }));
}

/**
 * Resolve a SKU to a purchasable variant on the wholesale channel, for the
 * quick-order form.
 *
 * Uses authoritative PostgreSQL lookup with exact case-insensitive SKU matching.
 * Requires the customer JWT — fails closed on database / infrastructure errors.
 */
export async function findWholesaleVariantBySku(sku: string): Promise<
  | {
      found: true;
      variantId: string;
      productName: string;
      productSlug: string;
      sku: string;
      optionsText?: string;
      displayPrice?: string;
      purchasable: boolean;
    }
  | { found: false }
> {
  const trimmed = sku.trim();
  if (!trimmed) return { found: false as const };

  const token = await getAccessToken();
  if (!token) return { found: false as const };

  const variant = await getVariantByIdOrSku(trimmed);
  if (!variant) {
    return { found: false as const };
  }

  // Require exact case-insensitive SKU identity after lookup
  if (variant.sku.toLowerCase() !== trimmed.toLowerCase()) {
    return { found: false as const };
  }

  const isPurchasable =
    variant.product_status === "active" &&
    variant.active === true &&
    (variant.quantity_on_hand > 0 || variant.backorderable === true);

  const displayPrice = `$${(variant.price_in_cents / 100).toFixed(2)}`;

  return {
    found: true as const,
    variantId: variant.id,
    productName: variant.product_name,
    productSlug: variant.product_slug,
    sku: variant.sku,
    optionsText: variant.size_option
      ? `Size: UK/India ${variant.size_option}`
      : undefined,
    displayPrice,
    purchasable: isPurchasable,
  };
}
