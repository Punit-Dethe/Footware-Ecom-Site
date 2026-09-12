import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();

vi.mock("../index", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
}));

import {
  getVariantByIdOrSku,
  getVariantsByIdsOrSkus,
  listActiveProductSlugs,
  loadPublicCatalogRows,
} from "../catalog";

describe("Database Catalog Repository (src/lib/db/catalog)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadPublicCatalogRows", () => {
    it("executes bounded parallel queries without N+1 loops", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "p1", name: "Shoe 1", status: "active" }] })
        .mockResolvedValueOnce({ rows: [{ id: "c1", name: "Category 1", slug: "cat-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "v1", product_id: "p1", sku: "SKU-1", active: true }] })
        .mockResolvedValueOnce({ rows: [{ product_id: "p1", category_id: "c1" }] });

      const res = await loadPublicCatalogRows();

      expect(mockQuery).toHaveBeenCalledTimes(4);
      expect(res.products).toHaveLength(1);
      expect(res.categories).toHaveLength(1);
      expect(res.variants).toHaveLength(1);
      expect(res.productCategories).toHaveLength(1);

      // Verify SQL contains active filters
      const productQuery = mockQuery.mock.calls[0][0];
      expect(productQuery).toContain("status = 'active'");

      const variantQuery = mockQuery.mock.calls[2][0];
      expect(variantQuery).toContain("v.active = TRUE");
    });
  });

  describe("getVariantByIdOrSku", () => {
    it("resolves variant by SKU and includes joined product fields", async () => {
      const mockRow = {
        id: "11111111-1111-1111-1111-111111111111",
        product_id: "22222222-2222-2222-2222-222222222222",
        sku: "MIRZA-OFF-001-8",
        size_option: "8",
        price_in_cents: 28500,
        currency: "USD",
        quantity_on_hand: 0,
        backorderable: true,
        active: true,
        product_name: "The Sovereign Wholecut Oxford",
        product_slug: "office-footwear-01",
        product_status: "active",
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const res = await getVariantByIdOrSku("MIRZA-OFF-001-8");

      expect(res).toBeDefined();
      expect(res?.sku).toBe("MIRZA-OFF-001-8");
      expect(res?.product_name).toBe("The Sovereign Wholecut Oxford");
      expect(res?.price_in_cents).toBe(28500);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("JOIN public.products");
      expect(params).toEqual(["MIRZA-OFF-001-8"]);
    });

    it("resolves variant by UUID", async () => {
      const uuid = "11111111-1111-1111-1111-111111111111";
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: uuid, sku: "MIRZA-OFF-001-8" }],
      });

      const res = await getVariantByIdOrSku(uuid);
      expect(res?.id).toBe(uuid);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("v.id = $1");
      expect(params).toEqual([uuid]);
    });

    it("returns null for unknown identifier", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await getVariantByIdOrSku("NON-EXISTENT-SKU");
      expect(res).toBeNull();
    });

    it("uses transaction-local client when provided instead of global query", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ id: "v-local", sku: "LOCAL-SKU" }] }),
      };

      const res = await getVariantByIdOrSku("LOCAL-SKU", mockClient);
      expect(res?.sku).toBe("LOCAL-SKU");
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("getVariantsByIdsOrSkus", () => {
    it("returns empty array for empty input without executing query", async () => {
      const res = await getVariantsByIdsOrSkus([]);
      expect(res).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("executes bulk query with ANY filters", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: "11111111-1111-1111-1111-111111111111", sku: "SKU-1" },
          { id: "22222222-2222-2222-2222-222222222222", sku: "SKU-2" },
        ],
      });

      const res = await getVariantsByIdsOrSkus(["SKU-1", "SKU-2"]);
      expect(res).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("listActiveProductSlugs", () => {
    it("queries active slugs ordered by created_at", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { slug: "office-footwear-01" },
          { slug: "office-footwear-02" },
        ],
      });

      const slugs = await listActiveProductSlugs();
      expect(slugs).toEqual(["office-footwear-01", "office-footwear-02"]);

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE status = 'active'");
    });
  });
});
