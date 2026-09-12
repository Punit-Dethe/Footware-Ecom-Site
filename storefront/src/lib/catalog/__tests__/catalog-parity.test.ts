import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = match[2]?.trim() || "";
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignore if not present
  }
}

const { mockCookies } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    mockCookies: {
      get: vi.fn((key: string) => {
        const val = store.get(key);
        return val ? { name: key, value: val } : undefined;
      }),
      getAll: vi.fn(() =>
        Array.from(store.entries()).map(([name, value]) => ({ name, value })),
      ),
      set: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn((key: string) => {
        store.delete(key);
      }),
      _store: store,
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookies),
  headers: vi.fn().mockReturnValue(new Map()),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
}));

import { cacheTag } from "next/cache";
import {
  EXPECTED_CATEGORIES,
  EXPECTED_PRODUCTS,
} from "./catalog-parity-fixture";
import {
  adaptRawCatalogToPublicSnapshot,
  getCategoryByPermalinkOrId,
  getProductBySlugOrId,
  getPublicCatalogSnapshot,
  listCatalogCategories,
  listCatalogProducts,
  queryProducts,
  searchCatalogVariants,
} from "../catalog-repository";
import { getVariantByIdOrSku } from "@/lib/db/catalog";
import { query } from "@/lib/db";
import { addToCart } from "@/lib/data/cart";
import {
  claimOrMergeGuestCart,
  createGuestCart,
  createUserCart,
  findCartById,
  loadCartItems,
} from "@/lib/db/cart";
import {
  cachedGetProduct,
  cachedGetProductFilters,
  cachedListProducts,
} from "@/lib/data/products";
import {
  cachedGetCategory,
  cachedListCategories,
  cachedListCategoryProducts,
} from "@/lib/data/categories";

describe("B6A Catalog Parity & Read Model Tests", () => {
  it("read model contains exact 2 categories matching baseline fixture", async () => {
    const categories = await listCatalogCategories();
    expect(categories).toHaveLength(EXPECTED_CATEGORIES.length);

    for (const expectedCat of EXPECTED_CATEGORIES) {
      const found = categories.find(
        (c) => c.slug === expectedCat.permalink.replace(/^categories\//, ""),
      );
      expect(found).toBeDefined();
      expect(found?.name).toBe(expectedCat.name);
      expect(found?.description).toBe(expectedCat.description);
    }
  });

  it("read model contains exact 38 active products matching baseline fixture", async () => {
    const products = await listCatalogProducts();
    expect(products).toHaveLength(EXPECTED_PRODUCTS.length);

    for (const expectedProd of EXPECTED_PRODUCTS) {
      const found = products.find((p) => p.slug === expectedProd.slug);
      expect(found).toBeDefined();

      // Names, SKUs, Descriptions
      expect(found?.name).toBe(expectedProd.name);
      expect(found?.sku).toBe(expectedProd.sku);
      expect(found?.description).toBe(expectedProd.description);
      expect(found?.description_html).toBe(expectedProd.description_html);

      // SEO
      expect(found?.meta_title).toBe(expectedProd.meta_title);
      expect(found?.meta_description).toBe(expectedProd.meta_description);
      expect(found?.meta_keywords).toBe(expectedProd.meta_keywords);

      // Price & Compare-at price
      expect(found?.price.amount_in_cents).toBe(
        expectedProd.price.amount_in_cents,
      );
      expect(found?.price.display_amount).toBe(
        expectedProd.price.display_amount,
      );
      expect(found?.price.compare_at_amount_in_cents).toBe(
        expectedProd.price.compare_at_amount_in_cents,
      );

      // Availability
      expect(found?.purchasable).toBe(true);
      expect(found?.in_stock).toBe(true);

      // Categories
      expect(found?.categories).toHaveLength(expectedProd.categories.length);
      const expectedCatSlug = expectedProd.categories[0].permalink.replace(
        /^categories\//,
        "",
      );
      expect(found?.categories[0].slug).toBe(expectedCatSlug);

      // Default variant semantics
      expect(found?.default_variant).toBeDefined();
      expect(found?.default_variant?.is_master).toBe(true);
      expect(found?.default_variant?.sku).toBe(`${expectedProd.sku}-8`);

      // Variants (exact 4 size variants: 7, 8, 9, 10)
      expect(found?.variants).toHaveLength(4);
      const sizes = found?.variants.map((v) => v.options_text);
      expect(sizes).toEqual([
        "Size: UK/India 7",
        "Size: UK/India 8",
        "Size: UK/India 9",
        "Size: UK/India 10",
      ]);

      for (let i = 0; i < 4; i++) {
        const expectedVar = expectedProd.variants[i];
        const actualVar = found?.variants[i];
        expect(actualVar?.sku).toBe(expectedVar.sku);
        expect(actualVar?.price.amount_in_cents).toBe(
          expectedVar.price.amount_in_cents,
        );
        expect(actualVar?.price.compare_at_amount_in_cents).toBe(
          expectedVar.price.compare_at_amount_in_cents,
        );
        expect(actualVar?.in_stock).toBe(true);
        expect(actualVar?.purchasable).toBe(true);
      }

      // Media association preserved
      expect(found?.thumbnail_url).toBe(expectedProd.thumbnail_url);
      expect(found?.primary_media.url).toBe(expectedProd.primary_media.url);
      expect(found?.product_media?.lqip).toBe(expectedProd.product_media?.lqip);
      expect(found?.product_media?.dominantColor).toBe(
        expectedProd.product_media?.dominantColor,
      );
    }
  });

  it("resolves product by slug, SKU, and variant SKU", async () => {
    const bySlug = await getProductBySlugOrId("office-footwear-01");
    expect(bySlug).toBeDefined();
    expect(bySlug?.sku).toBe("MIRZA-OFF-001");

    const bySku = await getProductBySlugOrId("MIRZA-OFF-001");
    expect(bySku?.id).toBe(bySlug?.id);

    const byVariantSku = await getProductBySlugOrId("MIRZA-OFF-001-9");
    expect(byVariantSku?.id).toBe(bySlug?.id);
  });

  it("resolves category by permalink and slug", async () => {
    const byPermalink = await getCategoryByPermalinkOrId(
      "categories/office-wear",
    );
    expect(byPermalink).toBeDefined();
    expect(byPermalink?.name).toBe("Office Wear");

    const bySlug = await getCategoryByPermalinkOrId("office-wear");
    expect(bySlug?.id).toBe(byPermalink?.id);
  });

  it("supports pagination, search, category filter, and price sort on read model", async () => {
    // Pagination (12 items)
    const page1 = await queryProducts({ page: 1, limit: 12 });
    expect(page1.data).toHaveLength(12);
    expect(page1.meta.total_count).toBe(38);
    expect(page1.meta.pages).toBe(4);

    // Category filter
    const officeProds = await queryProducts({
      in_category: "office-wear",
      limit: 50,
    });
    expect(officeProds.data).toHaveLength(19);

    const tradProds = await queryProducts({
      in_category: "traditional",
      limit: 50,
    });
    expect(tradProds.data).toHaveLength(19);

    // Search
    const searchRes = await queryProducts({ q: "Oxford" });
    expect(searchRes.data.length).toBeGreaterThan(0);
    expect(
      searchRes.data.every(
        (p) => p.name.includes("Oxford") || p.description.includes("Oxford"),
      ),
    ).toBe(true);

    // Price sort ascending
    const sortedAsc = await queryProducts({ sort: "price_asc", limit: 38 });
    for (let i = 0; i < sortedAsc.data.length - 1; i++) {
      expect(sortedAsc.data[i].price.amount_in_cents).toBeLessThanOrEqual(
        sortedAsc.data[i + 1].price.amount_in_cents,
      );
    }

    // Price sort descending
    const sortedDesc = await queryProducts({ sort: "price_desc", limit: 38 });
    for (let i = 0; i < sortedDesc.data.length - 1; i++) {
      expect(sortedDesc.data[i].price.amount_in_cents).toBeGreaterThanOrEqual(
        sortedDesc.data[i + 1].price.amount_in_cents,
      );
    }
  });
});

describe("PostgreSQL Variant Lookup & PDP Add-To-Cart Integration", () => {
  it("performs real UUID and SKU variant lookup, and returns null for unknown values", async () => {
    const firstExpectedVariant = EXPECTED_PRODUCTS[0].variants[0];

    // 1. Real variant SKU lookup -> PASS
    const bySku = await getVariantByIdOrSku(firstExpectedVariant.sku);
    expect(bySku).not.toBeNull();
    expect(bySku?.sku).toBe(firstExpectedVariant.sku);
    expect(bySku?.product_name).toBe(EXPECTED_PRODUCTS[0].name);
    const realUuid = bySku!.id;

    // 2. Real variant UUID lookup -> PASS
    const byUuid = await getVariantByIdOrSku(realUuid);
    expect(byUuid).not.toBeNull();
    expect(byUuid?.id).toBe(realUuid);
    expect(byUuid?.sku).toBe(firstExpectedVariant.sku);
    expect(byUuid?.product_slug).toBe(EXPECTED_PRODUCTS[0].slug);

    // 3. Unknown UUID -> null
    const unknownUuidRes = await getVariantByIdOrSku(
      "00000000-0000-0000-0000-000000000000",
    );
    expect(unknownUuidRes).toBeNull();

    // 4. Unknown SKU -> null
    const unknownSkuRes = await getVariantByIdOrSku("NONEXISTENT-SKU-9999");
    expect(unknownSkuRes).toBeNull();
  });

  it("PDP UUID add-to-cart persists exact variant UUID and matching variant SKU into PostgreSQL", async () => {
    const firstExpectedVariant = EXPECTED_PRODUCTS[0].variants[0];
    const variant = await getVariantByIdOrSku(firstExpectedVariant.sku);
    expect(variant).not.toBeNull();
    const realUuid = variant!.id;

    // Exercise normal PDP add-to-cart with UUID
    const result = await addToCart(realUuid, 1);
    expect(result.success).toBe(true);
    const cartId = (result as any).cart.id;

    try {
      // Query the DB directly to ensure authoritative variant_id and matching variant_sku
      const itemsRes = await query(
        "SELECT variant_id, variant_sku, quantity FROM public.cart_items WHERE cart_id = $1",
        [cartId],
      );
      expect(itemsRes.rows).toHaveLength(1);
      expect(itemsRes.rows[0].variant_id).toBe(realUuid);
      expect(itemsRes.rows[0].variant_sku).toBe(variant!.sku);
      expect(Number(itemsRes.rows[0].quantity)).toBe(1);
    } finally {
      // Clean up created cart and items
      await query("DELETE FROM public.cart_items WHERE cart_id = $1", [cartId]);
      await query("DELETE FROM public.carts WHERE id = $1", [cartId]);
      mockCookies._store.clear();
    }
  });
});

describe("Guest -> Existing-User Cart Merge (Case C Live DB Sanity)", () => {
  it("merges guest cart into existing user cart with variant_id NOT NULL and abandons guest cart", async () => {
    const firstExpectedVariant = EXPECTED_PRODUCTS[0].variants[0];
    const variant = await getVariantByIdOrSku(firstExpectedVariant.sku);
    expect(variant).not.toBeNull();
    const realUuid = variant!.id;
    const realSku = variant!.sku;

    const guestTokenHash = crypto.randomBytes(32).toString("hex");
    const userRes = await query("SELECT id FROM auth.users LIMIT 1");
    expect(userRes.rows.length).toBeGreaterThan(0);
    const testUserId = userRes.rows[0].id;

    // Archive any prior test carts for this user
    await query(
      "UPDATE public.carts SET status = 'abandoned' WHERE user_id = $1 AND status = 'active'",
      [testUserId],
    );

    // 1. Guest cart has SKU A (quantity 2)
    const guestCart = await createGuestCart(guestTokenHash, "dtc", "USD");
    await query(
      "INSERT INTO public.cart_items (cart_id, variant_id, variant_sku, quantity, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
      [guestCart.id, realUuid, realSku, 2],
    );

    // 2. User already has active cart with SKU A (quantity 1)
    const userCart = await createUserCart(testUserId, "dtc", "USD");
    await query(
      "INSERT INTO public.cart_items (cart_id, variant_id, variant_sku, quantity, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
      [userCart.id, realUuid, realSku, 1],
    );

    try {
      // 3. Login / claim
      const mergedCart = await claimOrMergeGuestCart(
        testUserId,
        guestTokenHash,
        "dtc",
      );
      expect(mergedCart.id).toBe(userCart.id);
      expect(mergedCart.status).toBe("active");

      // 4. Verify resulting user cart items
      const userItems = await loadCartItems(userCart.id);
      expect(userItems).toHaveLength(1);
      expect(userItems[0].quantity).toBe(3); // 1 + 2
      expect(userItems[0].variant_id).not.toBeNull();
      expect(userItems[0].variant_id).toBe(realUuid);
      expect(userItems[0].variant_sku).toBe(realSku);

      // 5. Verify guest cart is marked abandoned
      const guestCartRecord = await findCartById(guestCart.id);
      expect(guestCartRecord?.status).toBe("abandoned");
    } finally {
      // Clean up test data
      await query("DELETE FROM public.cart_items WHERE cart_id IN ($1, $2)", [
        guestCart.id,
        userCart.id,
      ]);
      await query("DELETE FROM public.carts WHERE id IN ($1, $2)", [
        guestCart.id,
        userCart.id,
      ]);
    }
  });
});

describe("Category Relationships & Product Integrity Rules", () => {
  it("never infers category from product slug when relationship is missing", () => {
    const adapted = adaptRawCatalogToPublicSnapshot({
      categories: [
        {
          id: "cat-1",
          slug: "office-wear",
          name: "Office Wear",
          description: "Office shoes",
          parent_id: null,
          position: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      products: [
        {
          id: "p-orphan",
          slug: "office-footwear-orphan",
          name: "Orphan Shoe",
          sku: "ORPHAN-BASE",
          description: "desc",
          description_html: null,
          meta_title: null,
          meta_description: null,
          meta_keywords: null,
          status: "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      variants: [
        {
          id: "v1",
          product_id: "p-orphan",
          sku: "ORPHAN-8",
          size_option: "8",
          is_default: true,
          active: true,
          price_in_cents: 10000,
          compare_at_price_in_cents: null,
          currency: "USD",
          quantity_on_hand: 10,
          backorderable: true,
          position: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      productCategories: [], // No product_categories join
    });

    expect(adapted.products[0].categories).toEqual([]);
  });

  it("fails catalog snapshot with integrity error when active product has 0 active variants (no $0 fallback)", () => {
    expect(() =>
      adaptRawCatalogToPublicSnapshot({
        categories: [
          {
            id: "c1",
            slug: "office-wear",
            name: "Office Wear",
            description: "d",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "p-zero",
            slug: "zero-variants",
            name: "Zero Var",
            sku: null,
            description: "d",
            description_html: null,
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [], // 0 active variants
        productCategories: [{ product_id: "p-zero", category_id: "c1" }],
      }),
    ).toThrow(
      /Catalog integrity error: Active product 'zero-variants'.*has no active variants/,
    );
  });

  it("fails catalog snapshot with integrity error when active product is missing default variant", () => {
    expect(() =>
      adaptRawCatalogToPublicSnapshot({
        categories: [
          {
            id: "c1",
            slug: "office-wear",
            name: "Office Wear",
            description: "d",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "p-no-def",
            slug: "no-default-variant",
            name: "No Default",
            sku: null,
            description: "d",
            description_html: null,
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "v1",
            product_id: "p-no-def",
            sku: "NO-DEF-8",
            size_option: "8",
            is_default: false,
            active: true,
            price_in_cents: 8000,
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 10,
            backorderable: true,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [{ product_id: "p-no-def", category_id: "c1" }],
      }),
    ).toThrow(
      /Catalog integrity error: Active product 'no-default-variant'.*must have exactly one default variant, found 0/,
    );
  });

  it("confirms 38/38 seeded products have expected category relationships and exactly 152 total variants", async () => {
    const snapshot = await getPublicCatalogSnapshot();
    expect(snapshot.products).toHaveLength(38);
    expect(snapshot.categories).toHaveLength(2);

    let totalVariants = 0;
    for (const product of snapshot.products) {
      expect(product.categories.length).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.default_variant).toBeDefined();
      expect(product.default_variant?.is_master).toBe(true);
      totalVariants += product.variants.length;
    }
    expect(totalVariants).toBe(152);
  });
});

describe("Outer Cache Invalidation Tag Propagation", () => {
  beforeEach(() => {
    vi.mocked(cacheTag).mockClear();
  });

  it("attaches 'catalog-public' tag to cachedListProducts", async () => {
    await cachedListProducts(undefined, {}, "dtc");
    expect(cacheTag).toHaveBeenCalledWith("catalog-public", expect.anything());
  });

  it("attaches 'catalog-public' tag to cachedGetProduct", async () => {
    await cachedGetProduct("office-footwear-01", [], {}, "dtc");
    expect(cacheTag).toHaveBeenCalledWith(
      "catalog-public",
      expect.anything(),
      expect.anything(),
    );
  });

  it("attaches 'catalog-public' tag to cachedGetProductFilters", async () => {
    await cachedGetProductFilters(undefined, {}, "dtc");
    expect(cacheTag).toHaveBeenCalledWith("catalog-public", expect.anything());
  });

  it("attaches 'catalog-public' tag to cachedListCategories", async () => {
    await cachedListCategories(undefined, {});
    expect(cacheTag).toHaveBeenCalledWith("categories", "catalog-public");
  });

  it("attaches 'catalog-public' tag to cachedGetCategory", async () => {
    await cachedGetCategory("office-wear", undefined, {});
    expect(cacheTag).toHaveBeenCalledWith("catalog-public", "category");
  });

  it("attaches 'catalog-public' tag to cachedListCategoryProducts", async () => {
    await cachedListCategoryProducts("office-wear", undefined, {});
    expect(cacheTag).toHaveBeenCalledWith(
      "catalog-public",
      "products",
      expect.anything(),
    );
  });
});

describe("searchCatalogVariants in-memory search", () => {
  it("returns empty array for query with fewer than 2 characters", async () => {
    const res = await searchCatalogVariants("a");
    expect(res).toEqual([]);
  });

  it("searches variants by product name matching public snapshot", async () => {
    const res = await searchCatalogVariants("Wholecut Oxford", 5);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].productName).toContain("Wholecut Oxford");
    expect(res[0].variantId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res[0].sku).toMatch(/^MIRZA-/);
    expect(res[0].purchasable).toBe(true);
    expect(res[0].displayPrice).toBeDefined();
  });

  it("searches variants by exact or partial variant SKU", async () => {
    const res = await searchCatalogVariants("MIRZA-OFF-001-8", 5);
    expect(res.length).toBe(1);
    expect(res[0].sku).toBe("MIRZA-OFF-001-8");
    expect(res[0].productName).toBe("The Sovereign Wholecut Oxford");
  });

  it("searches variants by options text (size)", async () => {
    const res = await searchCatalogVariants("UK/India 10", 10);
    expect(res.length).toBeGreaterThan(0);
    for (const item of res) {
      expect(item.optionsText).toContain("10");
    }
  });

  it("respects the limit parameter", async () => {
    const res = await searchCatalogVariants("MIRZA", 3);
    expect(res).toHaveLength(3);
  });

  it("returns empty array when no product or variant matches query", async () => {
    const res = await searchCatalogVariants("NON_EXISTENT_QUERY_XYZ", 5);
    expect(res).toEqual([]);
  });
});

