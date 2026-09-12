import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSpree = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  getWholesaleClient: vi.fn(),
  isWholesaleEnabled: vi.fn().mockReturnValue(true),
}));

const mockCatalogRepo = vi.hoisted(() => ({
  searchCatalogVariants: vi.fn(),
}));

const mockDbCatalog = vi.hoisted(() => ({
  getVariantByIdOrSku: vi.fn(),
}));

vi.mock("@/lib/spree", () => ({
  getAccessToken: mockSpree.getAccessToken,
  getWholesaleClient: mockSpree.getWholesaleClient,
  isWholesaleEnabled: mockSpree.isWholesaleEnabled,
}));

vi.mock("@/lib/catalog/catalog-repository", () => ({
  searchCatalogVariants: mockCatalogRepo.searchCatalogVariants,
}));

vi.mock("@/lib/db/catalog", () => ({
  getVariantByIdOrSku: mockDbCatalog.getVariantByIdOrSku,
}));

vi.mock("../products", () => ({
  getProduct: vi.fn(),
  getProductFilters: vi.fn(),
  getProducts: vi.fn(),
}));

import {
  findWholesaleVariantBySku,
  searchWholesaleVariants,
} from "../wholesale";

describe("Wholesale Quick-Order First-Party Catalog Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchWholesaleVariants", () => {
    it("returns empty array for short query (< 2 chars) without querying auth or catalog", async () => {
      const res = await searchWholesaleVariants("a");
      expect(res).toEqual([]);
      expect(mockSpree.getAccessToken).not.toHaveBeenCalled();
      expect(mockCatalogRepo.searchCatalogVariants).not.toHaveBeenCalled();
    });

    it("returns empty array when unauthenticated (no token)", async () => {
      mockSpree.getAccessToken.mockResolvedValue(null);
      const res = await searchWholesaleVariants("Oxford");
      expect(res).toEqual([]);
      expect(mockSpree.getAccessToken).toHaveBeenCalled();
      expect(mockCatalogRepo.searchCatalogVariants).not.toHaveBeenCalled();
    });

    it("searches catalog variants by product name / SKU and returns PostgreSQL UUID results", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockCatalogRepo.searchCatalogVariants.mockResolvedValue([
        {
          variantId: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
          productName: "The Sovereign Wholecut Oxford",
          productSlug: "office-footwear-01",
          optionsText: "Size: UK/India 8",
          sku: "MIRZA-OFF-001-8",
          displayPrice: "$285.00",
          purchasable: true,
        },
      ]);

      const res = await searchWholesaleVariants("Oxford", 5);
      expect(res).toEqual([
        {
          variantId: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
          productName: "The Sovereign Wholecut Oxford",
          optionsText: "Size: UK/India 8",
          sku: "MIRZA-OFF-001-8",
          displayPrice: "$285.00",
          purchasable: true,
        },
      ]);

      expect(mockCatalogRepo.searchCatalogVariants).toHaveBeenCalledWith(
        "Oxford",
        5,
      );
    });

    it("propagates DB / cache outage without swallowing error into empty array", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockCatalogRepo.searchCatalogVariants.mockRejectedValue(
        new Error("Database connection pool exhausted"),
      );

      await expect(searchWholesaleVariants("Oxford")).rejects.toThrow(
        "Database connection pool exhausted",
      );
    });
  });

  describe("findWholesaleVariantBySku", () => {
    it("returns { found: false } for empty / whitespace SKU", async () => {
      const res = await findWholesaleVariantBySku("   ");
      expect(res).toEqual({ found: false });
      expect(mockSpree.getAccessToken).not.toHaveBeenCalled();
      expect(mockDbCatalog.getVariantByIdOrSku).not.toHaveBeenCalled();
    });

    it("returns { found: false } when unauthenticated", async () => {
      mockSpree.getAccessToken.mockResolvedValue(null);
      const res = await findWholesaleVariantBySku("MIRZA-OFF-001-8");
      expect(res).toEqual({ found: false });
      expect(mockDbCatalog.getVariantByIdOrSku).not.toHaveBeenCalled();
    });

    it("returns { found: false } when SKU does not exist in catalog", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockResolvedValue(null);

      const res = await findWholesaleVariantBySku("NONEXISTENT-SKU");
      expect(res).toEqual({ found: false });
      expect(mockDbCatalog.getVariantByIdOrSku).toHaveBeenCalledWith(
        "NONEXISTENT-SKU",
      );
    });

    it("resolves valid SKU with DB price formatting and case-insensitive matching", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockResolvedValue({
        id: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        product_id: "prod-1",
        sku: "MIRZA-OFF-001-8",
        size_option: "8",
        price_in_cents: 28500,
        currency: "USD",
        quantity_on_hand: 10,
        backorderable: true,
        active: true,
        product_name: "The Sovereign Wholecut Oxford",
        product_slug: "office-footwear-01",
        product_status: "active",
      });

      const res = await findWholesaleVariantBySku("mirza-off-001-8");
      expect(res).toEqual({
        found: true,
        variantId: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        productName: "The Sovereign Wholecut Oxford",
        productSlug: "office-footwear-01",
        sku: "MIRZA-OFF-001-8",
        optionsText: "Size: UK/India 8",
        displayPrice: "$285.00",
        purchasable: true,
      });
    });

    it("derives purchasable: false when product is not active", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockResolvedValue({
        id: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        sku: "MIRZA-OFF-001-8",
        size_option: "8",
        price_in_cents: 28500,
        currency: "USD",
        quantity_on_hand: 10,
        backorderable: true,
        active: true,
        product_name: "The Sovereign Wholecut Oxford",
        product_slug: "office-footwear-01",
        product_status: "archived",
      });

      const res = await findWholesaleVariantBySku("MIRZA-OFF-001-8");
      expect(res).toEqual({
        found: true,
        variantId: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        productName: "The Sovereign Wholecut Oxford",
        productSlug: "office-footwear-01",
        sku: "MIRZA-OFF-001-8",
        optionsText: "Size: UK/India 8",
        displayPrice: "$285.00",
        purchasable: false,
      });
    });

    it("derives purchasable: false when variant is not active", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockResolvedValue({
        id: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        sku: "MIRZA-OFF-001-8",
        size_option: "8",
        price_in_cents: 28500,
        currency: "USD",
        quantity_on_hand: 10,
        backorderable: true,
        active: false,
        product_name: "The Sovereign Wholecut Oxford",
        product_slug: "office-footwear-01",
        product_status: "active",
      });

      const res = await findWholesaleVariantBySku("MIRZA-OFF-001-8");
      expect(res.found).toBe(true);
      if (res.found) {
        expect(res.purchasable).toBe(false);
      }
    });

    it("derives purchasable: false when out of stock and not backorderable", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockResolvedValue({
        id: "7406f1a7-15a4-4af9-8fb5-d136bbf6392c",
        sku: "MIRZA-OFF-001-8",
        size_option: "8",
        price_in_cents: 28500,
        currency: "USD",
        quantity_on_hand: 0,
        backorderable: false,
        active: true,
        product_name: "The Sovereign Wholecut Oxford",
        product_slug: "office-footwear-01",
        product_status: "active",
      });

      const res = await findWholesaleVariantBySku("MIRZA-OFF-001-8");
      expect(res.found).toBe(true);
      if (res.found) {
        expect(res.purchasable).toBe(false);
      }
    });

    it("propagates DB / infrastructure outage without swallowing error into { found: false }", async () => {
      mockSpree.getAccessToken.mockResolvedValue("mock-jwt-token");
      mockDbCatalog.getVariantByIdOrSku.mockRejectedValue(
        new Error("PostgreSQL connection timeout"),
      );

      await expect(findWholesaleVariantBySku("MIRZA-OFF-001-8")).rejects.toThrow(
        "PostgreSQL connection timeout",
      );
    });
  });

  describe("Static / Source-Level Runtime Guard", () => {
    it("proves production runtime contains no Spree product/category reads in affected modules", () => {
      const filesToAudit = [
        path.resolve(process.cwd(), "src/lib/data/wholesale.ts"),
        path.resolve(process.cwd(), "src/lib/data/sitemap.ts"),
        path.resolve(process.cwd(), "src/lib/catalog/catalog-repository.ts"),
      ];

      const forbiddenPatterns = [
        /\.products\.list\(/,
        /\.products\.get\(/,
        /\.categories\.list\(/,
        /\.categories\.get\(/,
        /getClient\(\)\.products/,
        /getClient\(\)\.categories/,
        /getWholesaleClient\(\)\.products/,
        /getWholesaleClient\(\)\.categories/,
      ];

      for (const filePath of filesToAudit) {
        const content = fs.readFileSync(filePath, "utf8");
        for (const pattern of forbiddenPatterns) {
          expect(content).not.toMatch(pattern);
        }
      }
    });
  });
});
