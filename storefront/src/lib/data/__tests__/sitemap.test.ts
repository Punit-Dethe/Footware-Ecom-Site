import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCatalog = vi.hoisted(() => ({
  queryProducts: vi.fn(),
  listCatalogCategories: vi.fn(),
}));

const mockCache = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const mockSpree = vi.hoisted(() => ({
  getClient: vi.fn(),
}));

vi.mock("@/lib/catalog/catalog-repository", () => ({
  queryProducts: mockCatalog.queryProducts,
  listCatalogCategories: mockCatalog.listCatalogCategories,
}));

vi.mock("next/cache", () => ({
  cacheLife: mockCache.cacheLife,
  cacheTag: mockCache.cacheTag,
}));

vi.mock("@/lib/spree", () => ({
  getClient: mockSpree.getClient,
}));

import {
  getSitemapCategoryPage,
  getSitemapProductPage,
  getSitemapResourceCount,
} from "@/lib/data/sitemap";

describe("First-Party Sitemap Data Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSitemapResourceCount", () => {
    it("uses first-party queryProducts for product resource count and attaches catalog-public tag", async () => {
      mockCatalog.queryProducts.mockResolvedValue({
        data: [],
        meta: { count: 1, total_count: 38, pages: 38 },
      });

      const count = await getSitemapResourceCount("products", "market-1", {
        country: "us",
        locale: "en",
      });

      expect(count).toBe(38);
      expect(mockCatalog.queryProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 1,
      });
      expect(mockCache.cacheLife).toHaveBeenCalledWith("tenMinutes");
      expect(mockCache.cacheTag).toHaveBeenCalledWith(
        "catalog-public",
        "sitemap",
        "products",
        "sitemap-market:market-1",
      );
      expect(mockSpree.getClient).not.toHaveBeenCalled();
    });

    it("uses first-party listCatalogCategories for category resource count and attaches catalog-public tag", async () => {
      mockCatalog.listCatalogCategories.mockResolvedValue([
        { id: "cat-1", slug: "office-wear", name: "Office Wear" },
        { id: "cat-2", slug: "traditional", name: "Traditional" },
      ]);

      const count = await getSitemapResourceCount("categories", "market-1", {
        country: "us",
        locale: "en",
      });

      expect(count).toBe(2);
      expect(mockCatalog.listCatalogCategories).toHaveBeenCalled();
      expect(mockCache.cacheLife).toHaveBeenCalledWith("tenMinutes");
      expect(mockCache.cacheTag).toHaveBeenCalledWith(
        "catalog-public",
        "sitemap",
        "categories",
        "sitemap-market:market-1",
      );
      expect(mockSpree.getClient).not.toHaveBeenCalled();
    });
  });

  describe("getSitemapProductPage", () => {
    it("uses first-party queryProducts for product pages and attaches catalog-public tag", async () => {
      const dummyProducts = [
        { id: "prod-1", slug: "office-footwear-01", name: "Oxford" },
        { id: "prod-2", slug: "office-footwear-02", name: "Derby" },
      ];
      mockCatalog.queryProducts.mockResolvedValue({
        data: dummyProducts,
        meta: { count: 2, total_count: 38, pages: 19 },
      });

      const products = await getSitemapProductPage("market-1", 1, 2, {
        country: "us",
        locale: "en",
      });

      expect(products).toEqual(dummyProducts);
      expect(mockCatalog.queryProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 2,
      });
      expect(mockCache.cacheLife).toHaveBeenCalledWith("tenMinutes");
      expect(mockCache.cacheTag).toHaveBeenCalledWith(
        "catalog-public",
        "sitemap",
        "products",
        "sitemap-market:market-1",
      );
      expect(mockSpree.getClient).not.toHaveBeenCalled();
    });
  });

  describe("getSitemapCategoryPage", () => {
    it("uses first-party listCatalogCategories with in-memory pagination and attaches catalog-public tag", async () => {
      const allCategories = [
        { id: "cat-1", slug: "office-wear", name: "Office Wear" },
        { id: "cat-2", slug: "traditional", name: "Traditional" },
      ];
      mockCatalog.listCatalogCategories.mockResolvedValue(allCategories);

      const page1 = await getSitemapCategoryPage("market-1", 1, 1, {
        country: "us",
        locale: "en",
      });
      expect(page1).toEqual([allCategories[0]]);

      const page2 = await getSitemapCategoryPage("market-1", 2, 1, {
        country: "us",
        locale: "en",
      });
      expect(page2).toEqual([allCategories[1]]);

      expect(mockCatalog.listCatalogCategories).toHaveBeenCalledTimes(2);
      expect(mockCache.cacheLife).toHaveBeenCalledWith("tenMinutes");
      expect(mockCache.cacheTag).toHaveBeenCalledWith(
        "catalog-public",
        "sitemap",
        "categories",
        "sitemap-market:market-1",
      );
      expect(mockSpree.getClient).not.toHaveBeenCalled();
    });
  });
});
