import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import {
  loadPublicCatalogRows,
  type DbCatalogVariantRow,
  type PublicCatalogRawData,
} from "@/lib/db/catalog";
import manifestData from "@/lib/media/manifest.json";
import type { ProductMedia } from "@/lib/media/types";
import {
  COUNTRIES,
  MARKETS,
  POLICIES,
  type StoreCountry,
  type StoreMarket,
  type StorePolicy,
} from "./store-config";

export type { ProductMedia, StoreCountry, StoreMarket, StorePolicy };
export { COUNTRIES, MARKETS, POLICIES };

export interface CatalogMedia {
  id: string;
  url: string;
  alt: string;
  position?: number;
  media_type?: string;
  original_url?: string;
  large_url?: string;
  xlarge_url?: string;
  small_url?: string;
  mini_url?: string;
  variant_ids?: string[];
  focal_point_x?: number;
  focal_point_y?: number;
}

export interface CatalogOptionValue {
  id: string;
  option_type_id: string;
  name: string;
  label: string;
  position: number;
  color_code: string | null;
  option_type_name: string;
  option_type_label: string;
  presentation?: string;
  image_url: string | null;
}

export interface CatalogOptionType {
  id: string;
  name: string;
  label: string;
  position: number;
  kind: string;
  presentation?: string;
}

export interface CatalogVariant {
  id: string;
  product_id?: string;
  is_master: boolean;
  sku: string;
  in_stock: boolean;
  purchasable: boolean;
  track_inventory?: boolean;
  price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
    compare_at_amount_in_cents?: number;
    display_compare_at_amount?: string;
  };
  original_price?: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
  };
  options_text: string;
  option_values: CatalogOptionValue[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug?: string;
  permalink: string;
  description: string;
  parent_id: string | null;
  children: CatalogCategory[];
  ancestors: CatalogCategory[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  description_html: string;
  purchasable: boolean;
  in_stock: boolean;
  thumbnail_url: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  primary_media: CatalogMedia;
  media: CatalogMedia[];
  product_media?: ProductMedia;
  price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
    compare_at_amount?: string;
    compare_at_amount_in_cents?: number;
    display_compare_at_amount?: string;
  };
  original_price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
  };
  categories: CatalogCategory[];
  default_variant_id: string;
  default_variant?: CatalogVariant;
  variants: CatalogVariant[];
  option_types: CatalogOptionType[];
}

export interface PublicCatalogSnapshot {
  products: CatalogProduct[];
  categories: CatalogCategory[];
}

const typedManifest = manifestData as Record<
  string,
  {
    slug: string;
    hash: string;
    dominantColor: string;
    lqip: string;
    mainUrl: string;
    variants: Record<string, { avif: string; webp: string }>;
  }
>;

/**
 * Pure adapter converting raw database catalog rows into compatibility DTO shapes.
 */
export function adaptRawCatalogToPublicSnapshot(
  raw: PublicCatalogRawData,
): PublicCatalogSnapshot {
  // 1. Adapt Categories
  const categoryMap = new Map<string, CatalogCategory>();
  const categories: CatalogCategory[] = raw.categories.map((c) => {
    const cat: CatalogCategory = {
      id: c.id,
      name: c.name,
      slug: c.slug,
      permalink: `categories/${c.slug}`,
      description: c.description || "",
      parent_id: c.parent_id,
      children: [],
      ancestors: [],
    };
    categoryMap.set(c.id, cat);
    return cat;
  });

  // Group variants by product_id
  const variantsByProductId = new Map<string, DbCatalogVariantRow[]>();
  for (const v of raw.variants) {
    const list = variantsByProductId.get(v.product_id) || [];
    list.push(v);
    variantsByProductId.set(v.product_id, list);
  }

  // Group categories by product_id
  const categoryIdsByProductId = new Map<string, string[]>();
  for (const join of raw.productCategories) {
    const list = categoryIdsByProductId.get(join.product_id) || [];
    list.push(join.category_id);
    categoryIdsByProductId.set(join.product_id, list);
  }

  // 2. Adapt Products
  const products: CatalogProduct[] = raw.products.map((p) => {
    const dbVariants = variantsByProductId.get(p.id) || [];
    const catIds = categoryIdsByProductId.get(p.id) || [];
    const prodCategories = catIds
      .map((id) => categoryMap.get(id))
      .filter((c): c is CatalogCategory => c != null);

    const manifest = typedManifest[p.slug];
    const primaryUrl =
      manifest?.variants?.["640"]?.webp ||
      manifest?.mainUrl ||
      `/products/${p.slug}/card-lg-640.webp`;
    const originalUrl = manifest?.variants?.["1600"]?.webp || primaryUrl;
    const thumbUrl = manifest?.variants?.["320"]?.webp || primaryUrl;

    const variants: CatalogVariant[] = dbVariants.map((v, sIdx) => {
      const cents = v.price_in_cents;
      const compareCents =
        v.compare_at_price_in_cents != null
          ? v.compare_at_price_in_cents
          : Math.round(cents * 1.15);
      const amountStr = (cents / 100).toFixed(2);
      const compareStr = (compareCents / 100).toFixed(2);
      const displayAmount = `$${amountStr}`;
      const displayCompareAmount = `$${compareStr}`;
      const isAvailable = (v.quantity_on_hand > 0 || v.backorderable) && v.active;

      return {
        id: v.id,
        product_id: p.id,
        is_master: v.is_default,
        sku: v.sku,
        in_stock: isAvailable,
        purchasable: isAvailable,
        track_inventory: true,
        price: {
          amount: amountStr,
          currency: v.currency || "USD",
          display_amount: displayAmount,
          amount_in_cents: cents,
          compare_at_amount_in_cents: compareCents,
          display_compare_at_amount: displayCompareAmount,
        },
        original_price: {
          amount: amountStr,
          currency: v.currency || "USD",
          display_amount: displayAmount,
          amount_in_cents: cents,
        },
        options_text: v.size_option ? `Size: UK/India ${v.size_option}` : "Standard",
        option_values: v.size_option
          ? [
              {
                id: `opt_sz_${v.size_option}`,
                option_type_id: "ot_size",
                name: v.size_option,
                label: `UK/India ${v.size_option}`,
                presentation: `UK/India ${v.size_option}`,
                position: v.position || sIdx + 1,
                color_code: null,
                option_type_name: "size",
                option_type_label: "Size",
                image_url: null,
              },
            ]
          : [],
      };
    });

    if (variants.length === 0) {
      throw new Error(
        `Catalog integrity error: Active product '${p.slug}' (${p.id}) has no active variants`,
      );
    }

    const defaultVariants = variants.filter((v) => v.is_master);
    if (defaultVariants.length !== 1) {
      throw new Error(
        `Catalog integrity error: Active product '${p.slug}' (${p.id}) must have exactly one default variant, found ${defaultVariants.length}`,
      );
    }

    const defaultVariant = defaultVariants[0];

    const primaryMedia: CatalogMedia = {
      id: `med_${p.slug.replace(/-/g, "_")}_1`,
      url: primaryUrl,
      alt: p.name,
      position: 1,
      media_type: "image",
      original_url: originalUrl,
      large_url: primaryUrl,
      xlarge_url: originalUrl,
      small_url: thumbUrl,
      mini_url: thumbUrl,
      variant_ids: variants.map((v) => v.id),
    };

    const hasStock =
      p.status === "active" && variants.some((v) => v.in_stock && v.purchasable);

    const defaultPrice = defaultVariant.price;
    const defaultOriginalPrice =
      defaultVariant.original_price || defaultVariant.price;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || undefined,
      description: p.description || "",
      description_html: p.description_html || `<p>${p.description || ""}</p>`,
      purchasable: hasStock,
      in_stock: hasStock,
      meta_title: p.meta_title || `${p.name} | Mirza Footwear`,
      meta_description: p.meta_description || p.description,
      meta_keywords:
        p.meta_keywords || `${p.name}, handcrafted footwear, luxury leather`,
      thumbnail_url: thumbUrl,
      primary_media: primaryMedia,
      media: [primaryMedia],
      product_media: {
        mainUrl: primaryUrl,
        lqip: manifest?.lqip,
        dominantColor: manifest?.dominantColor || "#f5f5f5",
        variants: manifest?.variants,
      },
      price: {
        amount: defaultPrice.amount,
        currency: defaultPrice.currency,
        display_amount: defaultPrice.display_amount,
        amount_in_cents: defaultPrice.amount_in_cents,
        compare_at_amount:
          defaultPrice.compare_at_amount_in_cents != null
            ? (defaultPrice.compare_at_amount_in_cents / 100).toFixed(2)
            : undefined,
        compare_at_amount_in_cents: defaultPrice.compare_at_amount_in_cents,
        display_compare_at_amount: defaultPrice.display_compare_at_amount,
      },
      original_price: defaultOriginalPrice,
      categories: prodCategories,
      default_variant_id: defaultVariant.id,
      default_variant: defaultVariant,
      variants,
      option_types: [
        {
          id: "ot_size",
          name: "size",
          label: "Size",
          presentation: "Size",
          position: 1,
          kind: "button",
        },
      ],
    };
  });

  return { products, categories };
}

/**
 * Cached public catalog snapshot loaded from PostgreSQL.
 * Invalidated by cacheTag("catalog-public").
 */
async function cachedCatalogSnapshot(): Promise<PublicCatalogSnapshot> {
  "use cache: remote";
  try {
    cacheLife("hours");
    cacheTag("catalog-public");
  } catch {
    // In test environments without Next cacheComponents runtime, proceed directly
  }

  const raw = await loadPublicCatalogRows();
  return adaptRawCatalogToPublicSnapshot(raw);
}

/**
 * Public catalog snapshot getter.
 * Request-memoized via React cache() and multi-tenant cached via Next.js remote cache.
 */
export const getPublicCatalogSnapshot = cache(async () => {
  return await cachedCatalogSnapshot();
});

/**
 * Lists all active catalog products from the prepared read model.
 */
export async function listCatalogProducts(): Promise<CatalogProduct[]> {
  const snapshot = await getPublicCatalogSnapshot();
  return snapshot.products;
}

/**
 * Lists all catalog categories from the prepared read model.
 */
export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  const snapshot = await getPublicCatalogSnapshot();
  return snapshot.categories;
}

/**
 * Fast in-process product query/filter/sort/pagination on cached snapshot.
 */
export async function queryProducts(params: {
  page?: number;
  limit?: number;
  offset?: number;
  q?: string;
  category_id?: string;
  in_category?: string;
  sort?: string;
}) {
  const { products } = await getPublicCatalogSnapshot();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 12));

  let list = [...products];

  // Category filter
  const categoryFilter = params.in_category || params.category_id;
  if (categoryFilter) {
    const cleanCat = categoryFilter.toLowerCase();
    list = list.filter((p) =>
      p.categories.some(
        (c) =>
          c.id.toLowerCase() === cleanCat ||
          c.slug?.toLowerCase() === cleanCat ||
          c.permalink.toLowerCase() === cleanCat ||
          c.permalink.toLowerCase() === `categories/${cleanCat}` ||
          c.name.toLowerCase() === cleanCat ||
          (cleanCat === "7" && c.slug === "office-wear") ||
          (cleanCat === "8" && c.slug === "traditional") ||
          (cleanCat === "office-wear" && c.slug === "office-wear") ||
          (cleanCat === "traditional" && c.slug === "traditional"),
      ),
    );
  }

  // Search filter
  if (params.q && params.q.trim().length > 0) {
    const searchTerms = params.q.toLowerCase().trim().split(/\s+/);
    list = list.filter((p) => {
      const haystack = `${p.name} ${p.description} ${p.slug} ${p.sku || ""}`.toLowerCase();
      return searchTerms.every((term) => haystack.includes(term));
    });
  }

  // Sorting
  if (params.sort) {
    if (params.sort === "price_asc" || params.sort === "price") {
      list.sort((a, b) => a.price.amount_in_cents - b.price.amount_in_cents);
    } else if (params.sort === "price_desc" || params.sort === "-price") {
      list.sort((a, b) => b.price.amount_in_cents - a.price.amount_in_cents);
    } else if (params.sort === "name" || params.sort === "name_asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex =
    params.offset != null
      ? Math.max(0, Number(params.offset))
      : (page - 1) * limit;
  const paginatedData = list.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    meta: {
      count: paginatedData.length,
      total_count: totalCount,
      page,
      pages: totalPages,
    },
  };
}

/**
 * Resolves a product by slug, UUID, SKU, or variant identifier.
 */
export async function getProductBySlugOrId(
  slugOrId: string,
): Promise<CatalogProduct | null> {
  const { products } = await getPublicCatalogSnapshot();
  const clean = slugOrId.toLowerCase().trim();
  return (
    products.find(
      (p) =>
        p.slug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.sku?.toLowerCase() === clean ||
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") === clean ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase() === clean ||
            v.id.toLowerCase() === clean ||
            v.sku.toLowerCase().endsWith(`-${clean}`),
        ),
    ) || null
  );
}

/**
 * Resolves a category by permalink, slug, or ID.
 */
export async function getCategoryByPermalinkOrId(
  permalinkOrId: string,
): Promise<CatalogCategory | null> {
  const { categories } = await getPublicCatalogSnapshot();
  const clean = permalinkOrId.toLowerCase().replace(/^categories\//, "");
  return (
    categories.find(
      (c) =>
        c.id === permalinkOrId ||
        c.slug?.toLowerCase() === clean ||
        c.permalink.toLowerCase() === clean ||
        c.permalink.toLowerCase() === `categories/${clean}` ||
        c.name.toLowerCase() === clean ||
        (permalinkOrId === "7" && c.slug === "office-wear") ||
        (permalinkOrId === "8" && c.slug === "traditional"),
    ) || null
  );
}

/**
 * Computes filter aggregates from the prepared read model.
 */
export async function getCatalogFilters(params?: {
  in_category?: string;
  category_id?: string;
}) {
  const { products, categories } = await getPublicCatalogSnapshot();

  const officeCount = products.filter((p) =>
    p.categories.some((c) => c.slug === "office-wear"),
  ).length;
  const traditionalCount = products.filter((p) =>
    p.categories.some((c) => c.slug === "traditional"),
  ).length;

  const categoryOptions = categories.map((cat) => {
    const count = cat.slug === "office-wear" ? officeCount : traditionalCount;
    return {
      id: cat.id,
      name: cat.name,
      label: cat.name,
      count,
      active:
        params?.category_id === cat.id ||
        params?.in_category === cat.permalink ||
        params?.in_category === cat.id ||
        params?.in_category === cat.slug ||
        (params?.category_id === "7" && cat.slug === "office-wear") ||
        (params?.category_id === "8" && cat.slug === "traditional") ||
        (params?.in_category === "categories/office-wear" &&
          cat.slug === "office-wear") ||
        (params?.in_category === "categories/traditional" &&
          cat.slug === "traditional"),
    };
  });

  const filters = [
    {
      id: "categories",
      label: "Category",
      name: "Category",
      type: "category",
      options: categoryOptions,
    },
    {
      id: "size",
      label: "Size",
      name: "Size",
      type: "option",
      kind: "button",
      options: [
        { id: "opt_sz_7", name: "7", label: "UK/India 7", count: products.length },
        { id: "opt_sz_8", name: "8", label: "UK/India 8", count: products.length },
        { id: "opt_sz_9", name: "9", label: "UK/India 9", count: products.length },
        { id: "opt_sz_10", name: "10", label: "UK/India 10", count: products.length },
      ],
    },
    {
      id: "price",
      name: "Price Range",
      type: "price_range",
      min: 180,
      max: 340,
      currency: "USD",
    },
    {
      id: "availability",
      name: "Availability",
      type: "availability",
      options: [{ id: "in_stock", name: "In Stock", count: products.length }],
    },
  ];

  const sortOptions = [
    { id: "default", label: "Recommended" },
    { id: "price_asc", label: "Price: Low to High" },
    { id: "price_desc", label: "Price: High to Low" },
    { id: "newest", label: "Newest" },
  ];

  return {
    filters,
    sort_options: sortOptions,
    default_sort: "default",
    data: filters,
    meta: { count: filters.length },
  };
}

/**
 * Resolves a variant and its parent product by SKU from the prepared read model.
 */
export async function findCatalogVariantBySku(
  sku: string,
): Promise<{ product: CatalogProduct; variant: CatalogVariant } | null> {
  const { products } = await getPublicCatalogSnapshot();
  for (const p of products) {
    const v = p.variants.find((vItem) => vItem.sku === sku);
    if (v) return { product: p, variant: v };
  }
  return null;
}

/**
 * Resolves a variant and its parent product by UUID or SKU from the prepared read model.
 */
export async function findCatalogVariantByIdOrSku(
  idOrSku: string,
): Promise<{ product: CatalogProduct; variant: CatalogVariant } | null> {
  const { products } = await getPublicCatalogSnapshot();
  for (const p of products) {
    const v = p.variants.find(
      (vItem) => vItem.id === idOrSku || vItem.sku === idOrSku,
    );
    if (v) return { product: p, variant: v };
  }
  return null;
}

export interface CatalogVariantSearchResult {
  variantId: string;
  productName: string;
  productSlug: string;
  optionsText?: string;
  sku: string;
  displayPrice?: string;
  purchasable: boolean;
}

/**
 * Fast in-memory variant search against the prepared public catalog snapshot.
 * Searches product name, product slug, product base SKU, variant SKU, and options text.
 * Warm lookups execute with 0 additional database queries.
 */
export async function searchCatalogVariants(
  query: string,
  limit = 8,
): Promise<CatalogVariantSearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const { products } = await getPublicCatalogSnapshot();
  const results: CatalogVariantSearchResult[] = [];

  for (const product of products) {
    const prodMatches =
      product.name.toLowerCase().includes(trimmed) ||
      product.slug.toLowerCase().includes(trimmed) ||
      (product.sku ? product.sku.toLowerCase().includes(trimmed) : false);

    for (const variant of product.variants) {
      if (!variant.sku) continue;

      const varMatches =
        prodMatches ||
        variant.sku.toLowerCase().includes(trimmed) ||
        variant.options_text.toLowerCase().includes(trimmed);

      if (varMatches) {
        results.push({
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          optionsText: variant.options_text || undefined,
          sku: variant.sku,
          displayPrice: variant.price.display_amount || undefined,
          purchasable: variant.purchasable,
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}
