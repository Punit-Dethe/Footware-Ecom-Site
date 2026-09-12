import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

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
import {
  EXPECTED_CATEGORIES,
  EXPECTED_PRODUCTS,
} from "./catalog-parity-fixture";

// Mock next/cache and react cache
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import {
  getCategoryByPermalinkOrId,
  getProductBySlugOrId,
  listCatalogCategories,
  listCatalogProducts,
  queryProducts,
} from "../catalog-repository";

describe("B6A Catalog Parity & Read Model Tests", () => {
  it("read model contains exact 2 categories matching baseline fixture", async () => {
    const categories = await listCatalogCategories();
    expect(categories).toHaveLength(EXPECTED_CATEGORIES.length);

    for (const expectedCat of EXPECTED_CATEGORIES) {
      const found = categories.find((c) => c.slug === expectedCat.permalink.replace(/^categories\//, ""));
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
      expect(found?.price.amount_in_cents).toBe(expectedProd.price.amount_in_cents);
      expect(found?.price.display_amount).toBe(expectedProd.price.display_amount);
      expect(found?.price.compare_at_amount_in_cents).toBe(
        expectedProd.price.compare_at_amount_in_cents,
      );

      // Availability
      expect(found?.purchasable).toBe(true);
      expect(found?.in_stock).toBe(true);

      // Categories
      expect(found?.categories).toHaveLength(expectedProd.categories.length);
      const expectedCatSlug = expectedProd.categories[0].permalink.replace(/^categories\//, "");
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
        expect(actualVar?.price.amount_in_cents).toBe(expectedVar.price.amount_in_cents);
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
    const byPermalink = await getCategoryByPermalinkOrId("categories/office-wear");
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
    const officeProds = await queryProducts({ in_category: "office-wear", limit: 50 });
    expect(officeProds.data).toHaveLength(19);

    const tradProds = await queryProducts({ in_category: "traditional", limit: 50 });
    expect(tradProds.data).toHaveLength(19);

    // Search
    const searchRes = await queryProducts({ q: "Oxford" });
    expect(searchRes.data.length).toBeGreaterThan(0);
    expect(searchRes.data.every((p) => p.name.includes("Oxford") || p.description.includes("Oxford"))).toBe(true);

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
