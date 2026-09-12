import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../index", () => ({
  query: mockDb.query,
  transaction: mockDb.transaction,
}));

import {
  archiveAdminProduct,
  createAdminProduct,
  deleteAdminCategoryIfSafe,
  listAdminProducts,
  restoreAdminProduct,
  saveAdminProduct,
} from "../admin-catalog";

describe("Admin Catalog DAL Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAdminProducts", () => {
    it("returns aggregated product summaries without N+1 queries", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: "prod-1",
            name: "Oxford Shoe",
            slug: "oxford-shoe",
            sku: "OXF-001",
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
            variant_count: 4,
            min_price_in_cents: 20000,
            max_price_in_cents: 25000,
            total_stock: 40,
            categories: [{ id: "cat-1", name: "Office", slug: "office" }],
          },
        ],
      });

      const products = await listAdminProducts();
      expect(products).toHaveLength(1);
      expect(products[0].variantCount).toBe(4);
      expect(products[0].minPriceInCents).toBe(20000);
      expect(products[0].totalStock).toBe(40);
      expect(products[0].categories[0].name).toBe("Office");
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });
  });

  describe("createAdminProduct", () => {
    it("creates a product with draft status and safe description_html", async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      const newId = await createAdminProduct({
        name: "Derby Classic",
        slug: "derby-classic",
        sku: "DRB-001",
        description: "<script>alert(1)</script> Great leather shoes.",
        categoryIds: ["cat-1"],
      });

      expect(typeof newId).toBe("string");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO public.products"),
        expect.arrayContaining([
          newId,
          "Derby Classic",
          "derby-classic",
          "DRB-001",
          "<script>alert(1)</script> Great leather shoes.",
          "<p>&lt;script&gt;alert(1)&lt;/script&gt; Great leather shoes.</p>",
        ]),
      );
    });
  });

  describe("saveAdminProduct - Publish Invariants & Security", () => {
    it("rejects publishing when product has 0 categories", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: "prod-1", status: "draft" }] });
          }
          if (sql.includes("UPDATE public.products")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("DELETE FROM public.product_categories")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("SELECT COUNT(*)::int AS count FROM public.product_categories")) {
            return Promise.resolve({ rows: [{ count: 0 }] }); // 0 categories
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct("prod-1", {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          status: "active",
          categoryIds: [],
          variants: [
            {
              sku: "TEST-001-8",
              sizeOption: "8",
              priceInCents: 15000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
          ],
        }),
      ).rejects.toThrow(
        "Cannot publish product: At least one category relationship is required",
      );
    });

    it("rejects publishing when product has 0 active variants", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: "prod-1", status: "draft" }] });
          }
          if (sql.includes("UPDATE public.products")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("DELETE FROM public.product_categories")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("INSERT INTO public.product_categories")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("SELECT COUNT(*)::int AS count FROM public.product_categories")) {
            return Promise.resolve({ rows: [{ count: 1 }] });
          }
          if (sql.includes("SELECT id, sku, size_option, price_in_cents")) {
            return Promise.resolve({
              rows: [
                {
                  id: "v-1",
                  sku: "TEST-001-8",
                  size_option: "8",
                  price_in_cents: 10000,
                  active: false, // Inactive!
                  is_default: true,
                },
              ],
            });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct("prod-1", {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          status: "active",
          categoryIds: ["cat-1"],
          variants: [
            {
              sku: "TEST-001-8",
              sizeOption: "8",
              priceInCents: 10000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: false,
            },
          ],
        }),
      ).rejects.toThrow(
        "Cannot publish product: At least one active variant is required",
      );
    });

    it("rejects publishing when price is 0 or negative", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: "prod-1", status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("SELECT COUNT(*)::int AS count FROM public.product_categories")) {
            return Promise.resolve({ rows: [{ count: 1 }] });
          }
          if (sql.includes("SELECT id, sku, size_option, price_in_cents")) {
            return Promise.resolve({
              rows: [
                {
                  id: "v-1",
                  sku: "TEST-001-8",
                  size_option: "8",
                  price_in_cents: 0, // Invalid 0 price!
                  quantity_on_hand: 5,
                  currency: "USD",
                  active: true,
                  is_default: true,
                },
              ],
            });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct("prod-1", {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          status: "active",
          categoryIds: ["cat-1"],
          variants: [
            {
              sku: "TEST-001-8",
              sizeOption: "8",
              priceInCents: 0,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
          ],
        }),
      ).rejects.toThrow("Active variant TEST-001-8 must have a price greater than 0");
    });

    it("rejects cross-product variant tampering", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: "prod-1", status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            // Only variant v-1 belongs to prod-1
            return Promise.resolve({ rows: [{ id: "v-1", sku: "SKU-1" }] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct("prod-1", {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: "v-FOREIGN-UUID", // Belongs to a different product!
              sku: "SKU-FOREIGN",
              sizeOption: "8",
              priceInCents: 10000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
          ],
        }),
      ).rejects.toThrow("Variant v-FOREIGN-UUID does not belong to product prod-1");
    });

    it("prevents renaming existing variant SKU", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: "prod-1", status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [{ id: "v-1", sku: "ORIGINAL-SKU" }] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct("prod-1", {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: "v-1",
              sku: "NEW-SKU-RENAMED", // Attempting to rename existing SKU
              sizeOption: "8",
              priceInCents: 10000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
          ],
        }),
      ).rejects.toThrow("Existing variant SKU \"ORIGINAL-SKU\" cannot be renamed");
    });
  });

  describe("archive and restore product", () => {
    it("sets product status to archived without deleting variants", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: "prod-1" }] });
      await archiveAdminProduct("prod-1");

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.products SET status = 'archived'"),
        ["prod-1"],
      );
    });

    it("restores archived product back to draft", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: "prod-1" }] });
      await restoreAdminProduct("prod-1");

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.products SET status = 'draft'"),
        ["prod-1"],
      );
    });
  });

  describe("deleteAdminCategoryIfSafe", () => {
    it("denies category deletion when referenced by products", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: 5 }] }); // 5 products linked

      await expect(deleteAdminCategoryIfSafe("cat-1")).rejects.toThrow(
        "Cannot delete category: Category is associated with one or more products.",
      );
    });

    it("denies category deletion when child categories exist", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // 0 products
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }); // 2 children

      await expect(deleteAdminCategoryIfSafe("cat-1")).rejects.toThrow(
        "Cannot delete category: Category has child subcategories.",
      );
    });

    it("deletes unreferenced category safely", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // 0 products
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // 0 children
        .mockResolvedValueOnce({ rows: [{ id: "cat-1" }] }); // delete success

      await deleteAdminCategoryIfSafe("cat-1");
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM public.categories WHERE id = $1"),
        ["cat-1"],
      );
    });
  });
});
