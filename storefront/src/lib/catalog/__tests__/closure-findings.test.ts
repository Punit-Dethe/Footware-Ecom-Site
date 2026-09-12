import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDbCatalog = vi.hoisted(() => ({
  loadPublicCatalogRows: vi.fn(),
  getVariantByIdOrSku: vi.fn(),
}));

vi.mock("@/lib/db/catalog", () => ({
  loadPublicCatalogRows: mockDbCatalog.loadPublicCatalogRows,
  getVariantByIdOrSku: mockDbCatalog.getVariantByIdOrSku,
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
}));

import type { PublicCatalogRawData } from "@/lib/db/catalog";
import {
  adaptRawCatalogToPublicSnapshot,
  getCatalogFilters,
} from "../catalog-repository";

describe("B6B.1 Closure Findings: Filters, Compare-At, and Media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Data-Driven Public Catalog Filters", () => {
    it("dynamically derives categories, sizes, price range, and real availability without hardcoding", async () => {
      // Create synthetic raw catalog data with:
      // - 3 categories (including a new third category "Sneakers")
      // - 3 products
      // - Dynamic sizes (including size "11" and "12")
      // - Dynamic price range ($45 to $550)
      // - Availability: 2 in-stock, 1 out-of-stock
      const rawData: PublicCatalogRawData = {
        categories: [
          {
            id: "cat-1",
            name: "Office Wear",
            slug: "office-wear",
            description: "Office shoes",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "cat-2",
            name: "Traditional",
            slug: "traditional",
            description: "Traditional shoes",
            parent_id: null,
            position: 2,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "cat-3",
            name: "Sneakers",
            slug: "sneakers",
            description: "Casual sneakers",
            parent_id: null,
            position: 3,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "prod-1",
            name: "Office Oxford",
            slug: "office-oxford",
            sku: "OXF-01",
            description: "Desc",
            description_html: "<p>Desc</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "prod-2",
            name: "Casual Sneaker",
            slug: "casual-sneaker",
            sku: "SNK-01",
            description: "Desc",
            description_html: "<p>Desc</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "prod-3",
            name: "Luxury Boot",
            slug: "luxury-boot",
            sku: "BOT-01",
            description: "Desc",
            description_html: "<p>Desc</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-1",
            product_id: "prod-1",
            sku: "OXF-01-8",
            size_option: "8",
            price_in_cents: 4500, // $45.00 min price
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 10,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "var-2",
            product_id: "prod-2",
            sku: "SNK-01-11",
            size_option: "11", // New size 11!
            price_in_cents: 12000, // $120.00
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 5,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: "var-3",
            product_id: "prod-3",
            sku: "BOT-01-12",
            size_option: "12", // New size 12!
            price_in_cents: 55000, // $550.00 max price
            compare_at_price_in_cents: 60000,
            currency: "USD",
            quantity_on_hand: 0, // OUT OF STOCK!
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [
          { product_id: "prod-1", category_id: "cat-1" },
          { product_id: "prod-2", category_id: "cat-3" }, // In Sneakers!
          { product_id: "prod-3", category_id: "cat-3" }, // Also in Sneakers!
        ],
      };

      mockDbCatalog.loadPublicCatalogRows.mockResolvedValue(rawData);

      const filterResult = await getCatalogFilters();
      const catFilter = filterResult.filters.find((f) => f.id === "categories");
      const sizeFilter = filterResult.filters.find((f) => f.id === "size");
      const priceFilter = filterResult.filters.find((f) => f.id === "price");
      const availFilter = filterResult.filters.find((f) => f.id === "availability");

      // 1. Third category has real count (2 products belong to Sneakers)
      const sneakerOption = catFilter?.options?.find((o: any) => o.name === "Sneakers");
      expect(sneakerOption).toBeDefined();
      expect(sneakerOption?.count).toBe(2);

      const officeOption = catFilter?.options?.find((o: any) => o.name === "Office Wear");
      expect(officeOption?.count).toBe(1);

      const traditionalOption = catFilter?.options?.find((o: any) => o.name === "Traditional");
      expect(traditionalOption?.count).toBe(0);

      // 2. Dynamic sizes include 8, 11, 12
      const sizeNames = sizeFilter?.options?.map((o: any) => o.name);
      expect(sizeNames).toContain("8");
      expect(sizeNames).toContain("11");
      expect(sizeNames).toContain("12");

      // 3. Dynamic price range derived from actual products ($45 to $550)
      expect(priceFilter?.min).toBe(45);
      expect(priceFilter?.max).toBe(550);

      // 4. Real availability count: only 2 products are in_stock (prod-3 is out of stock)
      const inStockOption = availFilter?.options?.find((o: any) => o.id === "in_stock");
      expect(inStockOption?.count).toBe(2);
    });
  });

  describe("2. Compare-At Null Semantics (No Synthetic Discount)", () => {
    it("preserves explicit compare_at_price_in_cents when present", () => {
      const rawData: PublicCatalogRawData = {
        categories: [
          {
            id: "cat-1",
            name: "Office",
            slug: "office",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "prod-1",
            name: "Discounted Shoe",
            slug: "discounted-shoe",
            sku: "DSC-01",
            description: "Desc",
            description_html: null,
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-1",
            product_id: "prod-1",
            sku: "DSC-01-8",
            size_option: "8",
            price_in_cents: 20000,
            compare_at_price_in_cents: 25000, // Explicit compare-at price
            currency: "USD",
            quantity_on_hand: 5,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [{ product_id: "prod-1", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(rawData);
      const product = snapshot.products[0];
      const variant = product.variants[0];

      expect(variant.price.amount_in_cents).toBe(20000);
      expect(variant.price.compare_at_amount_in_cents).toBe(25000);
      expect(variant.price.display_compare_at_amount).toBe("$250.00");
    });

    it("omits compare_at fields when compare_at_price_in_cents is null without synthetic 15% discount", () => {
      const rawData: PublicCatalogRawData = {
        categories: [
          {
            id: "cat-1",
            name: "Office",
            slug: "office",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "prod-1",
            name: "Regular Price Shoe",
            slug: "regular-price-shoe",
            sku: "REG-01",
            description: "Desc",
            description_html: null,
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-1",
            product_id: "prod-1",
            sku: "REG-01-8",
            size_option: "8",
            price_in_cents: 20000,
            compare_at_price_in_cents: null, // Null!
            currency: "USD",
            quantity_on_hand: 5,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [{ product_id: "prod-1", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(rawData);
      const product = snapshot.products[0];
      const variant = product.variants[0];

      expect(variant.price.amount_in_cents).toBe(20000);
      expect(variant.price.compare_at_amount_in_cents).toBeUndefined();
      expect(variant.price.display_compare_at_amount).toBeUndefined();

      // Product price also omits compare-at fields
      expect(product.price.compare_at_amount_in_cents).toBeUndefined();
      expect(product.price.display_compare_at_amount).toBeUndefined();
    });
  });

  describe("3. Manifest-Less Products Media Placeholder", () => {
    it("preserves manifest images for seeded products", () => {
      const rawData: PublicCatalogRawData = {
        categories: [
          {
            id: "cat-1",
            name: "Office",
            slug: "office-wear",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "prod-seeded",
            name: "Office Footwear 01",
            slug: "office-footwear-01", // Present in manifest.json
            sku: "MIRZA-OFF-001",
            description: "Seeded shoe",
            description_html: "<p>Seeded shoe</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-seeded",
            product_id: "prod-seeded",
            sku: "MIRZA-OFF-001-8",
            size_option: "8",
            price_in_cents: 29000,
            compare_at_price_in_cents: 34000,
            currency: "USD",
            quantity_on_hand: 10,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [{ product_id: "prod-seeded", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(rawData);
      const seededProduct = snapshot.products[0];

      expect(seededProduct.primary_media.url).toContain("/products/office-footwear-01/");
      expect(seededProduct.primary_media.url).not.toBe("/placeholder.svg");
      expect(seededProduct.product_media?.mainUrl).toContain("/products/office-footwear-01/");
    });

    it("falls back to /placeholder.svg for manifest-less newly created products without broken image paths", () => {
      const rawData: PublicCatalogRawData = {
        categories: [
          {
            id: "cat-1",
            name: "Office",
            slug: "office",
            description: "",
            parent_id: null,
            position: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        products: [
          {
            id: "prod-new-uuid",
            name: "Custom Bespoke Derby 2026",
            slug: "custom-bespoke-derby-2026", // Not in media-manifest.json!
            sku: "CSP-01",
            description: "A brand new shoe created via admin.",
            description_html: "<p>A brand new shoe created via admin.</p>",
            status: "active",
            meta_title: null,
            meta_description: null,
            meta_keywords: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        variants: [
          {
            id: "var-new-uuid",
            product_id: "prod-new-uuid",
            sku: "CSP-01-8",
            size_option: "8",
            price_in_cents: 22000,
            compare_at_price_in_cents: null,
            currency: "USD",
            quantity_on_hand: 10,
            backorderable: false,
            position: 1,
            is_default: true,
            active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        productCategories: [{ product_id: "prod-new-uuid", category_id: "cat-1" }],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(rawData);
      const product = snapshot.products[0];

      // Primary media, original media, thumb media, and product media all use /placeholder.svg
      expect(product.primary_media.url).toBe("/placeholder.svg");
      expect(product.primary_media.original_url).toBe("/placeholder.svg");
      expect(product.primary_media.small_url).toBe("/placeholder.svg");
      expect(product.product_media?.mainUrl).toBe("/placeholder.svg");

      // No 404 path invented
      expect(product.primary_media.url).not.toContain("card-lg-640.webp");
    });
  });
});
