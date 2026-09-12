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
  CatalogValidationError,
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategoryIfSafe,
  listAdminProducts,
  restoreAdminProduct,
  saveAdminProduct,
  updateAdminCategory,
  validateBoolean,
  validateInteger,
  validateSlug,
  validateStatus,
  validateUuid,
} from "../admin-catalog";

const TEST_PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const TEST_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const TEST_CATEGORY_ID_2 = "33333333-3333-4333-8333-333333333333";
const TEST_CATEGORY_ID_3 = "44444444-4444-4444-8444-444444444444";
const TEST_VARIANT_ID_1 = "55555555-5555-4555-8555-555555555555";
const TEST_VARIANT_ID_2 = "66666666-6666-4666-8666-666666666666";
const FOREIGN_VARIANT_ID = "77777777-7777-4777-8777-777777777777";

describe("Admin Catalog DAL Unit Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listAdminProducts Aggregation", () => {
    it("returns aggregated product summaries without N+1 queries", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_PRODUCT_ID,
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
            categories: [{ id: TEST_CATEGORY_ID, name: "Office", slug: "office" }],
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

      // Verify query uses independent CTEs to avoid Cartesian products
      const executedSql = mockDb.query.mock.calls[0][0];
      expect(executedSql).toContain("WITH variant_stats AS");
      expect(executedSql).toContain("cat_agg AS");
      expect(executedSql).toContain("LEFT JOIN variant_stats");
      expect(executedSql).toContain("LEFT JOIN cat_agg");
    });

    it("verifies multi-category product does not duplicate variant count or stock", async () => {
      // If a product has 2 categories and 3 variants (stock 10 each = 30 total),
      // the variant_stats CTE computes COUNT = 3, SUM = 30 independently from cat_agg.
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_PRODUCT_ID,
            name: "Multi Category Shoe",
            slug: "multi-category-shoe",
            sku: "MULTI-001",
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
            variant_count: 3, // Exactly 3 variants, not 6
            min_price_in_cents: 15000,
            max_price_in_cents: 15000,
            total_stock: 30, // Exactly 30, not 60
            categories: [
              { id: TEST_CATEGORY_ID, name: "Office", slug: "office" },
              { id: TEST_CATEGORY_ID_2, name: "Traditional", slug: "traditional" },
            ],
          },
        ],
      });

      const products = await listAdminProducts();
      expect(products[0].categories).toHaveLength(2);
      expect(products[0].variantCount).toBe(3);
      expect(products[0].totalStock).toBe(30);
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
        categoryIds: [TEST_CATEGORY_ID],
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
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
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
        saveAdminProduct(TEST_PRODUCT_ID, {
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
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
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
                  id: TEST_VARIANT_ID_1,
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
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          status: "active",
          categoryIds: [TEST_CATEGORY_ID],
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
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
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
                  id: TEST_VARIANT_ID_1,
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
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          status: "active",
          categoryIds: [TEST_CATEGORY_ID],
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
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            // Only TEST_VARIANT_ID_1 belongs to TEST_PRODUCT_ID
            return Promise.resolve({ rows: [{ id: TEST_VARIANT_ID_1, sku: "SKU-1" }] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: FOREIGN_VARIANT_ID, // Belongs to a different product!
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
      ).rejects.toThrow(`Variant ${FOREIGN_VARIANT_ID} does not belong to product ${TEST_PRODUCT_ID}`);
    });

    it("prevents renaming existing variant SKU", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [{ id: TEST_VARIANT_ID_1, sku: "ORIGINAL-SKU" }] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: TEST_VARIANT_ID_1,
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

  describe("Default Variant Switching (Order-Independent)", () => {
    function setupVariantSwitchClient() {
      const queries: string[] = [];
      const mockClient = {
        queries,
        query: vi.fn((sql: string) => {
          queries.push(sql);
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({
              rows: [
                { id: TEST_VARIANT_ID_1, sku: "SKU-1" },
                { id: TEST_VARIANT_ID_2, sku: "SKU-2" },
              ],
            });
          }
          if (sql.includes("FROM public.products") && sql.includes("WHERE id = $1")) {
            return Promise.resolve({
              rows: [
                {
                  id: TEST_PRODUCT_ID,
                  name: "Test Shoe",
                  slug: "test-shoe",
                  sku: "TEST-001",
                  description: null,
                  description_html: null,
                  status: "draft",
                  meta_title: null,
                  meta_description: null,
                  meta_keywords: null,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
            });
          }
          if (sql.includes("FROM public.categories c")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("FROM public.variants") && sql.includes("WHERE product_id = $1")) {
            return Promise.resolve({ rows: [] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));
      return mockClient;
    }

    it("clears product defaults inside transaction when switching default (old-before-new)", async () => {
      const mockClient = setupVariantSwitchClient();

      // Old default (v1) appears before new default (v2) in submitted array
      await saveAdminProduct(TEST_PRODUCT_ID, {
        name: "Test Shoe",
        slug: "test-shoe",
        sku: "TEST-001",
        variants: [
          {
            id: TEST_VARIANT_ID_1,
            sku: "SKU-1",
            priceInCents: 10000,
            quantityOnHand: 5,
            backorderable: false,
            isDefault: false, // Old default removed
            active: true,
          },
          {
            id: TEST_VARIANT_ID_2,
            sku: "SKU-2",
            priceInCents: 12000,
            quantityOnHand: 5,
            backorderable: false,
            isDefault: true, // New default
            active: true,
          },
        ],
      });

      // Verify that defaults were cleared BEFORE applying variant updates
      const clearIdx = mockClient.queries.findIndex((q) =>
        q.includes("UPDATE public.variants SET is_default = false"),
      );
      expect(clearIdx).toBeGreaterThan(-1);

      const updateV2Idx = mockClient.queries.findIndex(
        (q) => q.includes("UPDATE public.variants SET") && q.includes("is_default = $7"),
      );
      expect(clearIdx).toBeLessThan(updateV2Idx);
    });

    it("handles switching when new default appears before old default (new-before-old)", async () => {
      const mockClient = setupVariantSwitchClient();

      // New default (v2) appears before old default (v1) in submitted array
      await saveAdminProduct(TEST_PRODUCT_ID, {
        name: "Test Shoe",
        slug: "test-shoe",
        sku: "TEST-001",
        variants: [
          {
            id: TEST_VARIANT_ID_2,
            sku: "SKU-2",
            priceInCents: 12000,
            quantityOnHand: 5,
            backorderable: false,
            isDefault: true, // New default first
            active: true,
          },
          {
            id: TEST_VARIANT_ID_1,
            sku: "SKU-1",
            priceInCents: 10000,
            quantityOnHand: 5,
            backorderable: false,
            isDefault: false, // Old default second
            active: true,
          },
        ],
      });

      const clearIdx = mockClient.queries.findIndex((q) =>
        q.includes("UPDATE public.variants SET is_default = false"),
      );
      expect(clearIdx).toBeGreaterThan(-1);
    });

    it("supports setting newly-created variant as default", async () => {
      const mockClient = setupVariantSwitchClient();

      // Brand new variant (no id) becomes default
      await saveAdminProduct(TEST_PRODUCT_ID, {
        name: "Test Shoe",
        slug: "test-shoe",
        sku: "TEST-001",
        variants: [
          {
            id: TEST_VARIANT_ID_1,
            sku: "SKU-1",
            priceInCents: 10000,
            quantityOnHand: 5,
            backorderable: false,
            isDefault: false,
            active: true,
          },
          {
            sku: "SKU-NEW-BRAND",
            priceInCents: 14000,
            quantityOnHand: 10,
            backorderable: false,
            isDefault: true, // New variant is default
            active: true,
          },
        ],
      });

      const insertIdx = mockClient.queries.findIndex((q) =>
        q.includes("INSERT INTO public.variants"),
      );
      expect(insertIdx).toBeGreaterThan(-1);
    });

    it("rejects when multiple default variants are submitted", async () => {
      setupVariantSwitchClient();

      await expect(
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: TEST_VARIANT_ID_1,
              sku: "SKU-1",
              priceInCents: 10000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
            {
              id: TEST_VARIANT_ID_2,
              sku: "SKU-2",
              priceInCents: 12000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true, // Second default!
              active: true,
            },
          ],
        }),
      ).rejects.toThrow("Multiple default variants specified. At most one default variant is allowed.");
    });

    it("rolls back transaction when an error occurs after clearing default", async () => {
      const mockClient = {
        query: vi.fn((sql: string) => {
          if (sql.includes("SELECT id, status FROM public.products")) {
            return Promise.resolve({ rows: [{ id: TEST_PRODUCT_ID, status: "draft" }] });
          }
          if (sql.includes("SELECT id, sku FROM public.variants")) {
            return Promise.resolve({ rows: [{ id: TEST_VARIANT_ID_1, sku: "SKU-1" }] });
          }
          if (sql.includes("UPDATE public.variants SET is_default = false")) {
            return Promise.resolve({ rows: [] });
          }
          if (sql.includes("UPDATE public.variants SET")) {
            throw new Error("PostgreSQL foreign key / disk failure");
          }
          return Promise.resolve({ rows: [] });
        }),
      };
      mockDb.transaction.mockImplementation(async (cb: any) => {
        return await cb(mockClient);
      });

      await expect(
        saveAdminProduct(TEST_PRODUCT_ID, {
          name: "Test Shoe",
          slug: "test-shoe",
          sku: "TEST-001",
          variants: [
            {
              id: TEST_VARIANT_ID_1,
              sku: "SKU-1",
              priceInCents: 10000,
              quantityOnHand: 5,
              backorderable: false,
              isDefault: true,
              active: true,
            },
          ],
        }),
      ).rejects.toThrow("PostgreSQL foreign key / disk failure");
    });
  });

  describe("Category Hierarchy & Cycle Detection", () => {
    it("rejects direct self-parent cycle (parentId === id)", async () => {
      await expect(
        updateAdminCategory(TEST_CATEGORY_ID, {
          name: "Boots",
          slug: "boots",
          parentId: TEST_CATEGORY_ID, // Self-parent!
        }),
      ).rejects.toThrow("Category cannot be its own parent");
    });

    it("rejects 2-node cycle (A -> B -> A)", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID_2 }] }) // Parent B exists
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }); // Cycle check finds A in B's ancestor chain!

      await expect(
        updateAdminCategory(TEST_CATEGORY_ID, {
          name: "Category A",
          slug: "category-a",
          parentId: TEST_CATEGORY_ID_2,
        }),
      ).rejects.toThrow("Cannot set category parent: cycle detected in category hierarchy");
    });

    it("rejects 3-node transitive cycle (A -> B -> C -> A)", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID_3 }] }) // Parent C exists
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }); // Cycle check finds A in C's ancestor chain!

      await expect(
        updateAdminCategory(TEST_CATEGORY_ID, {
          name: "Category A",
          slug: "category-a",
          parentId: TEST_CATEGORY_ID_3,
        }),
      ).rejects.toThrow("Cannot set category parent: cycle detected in category hierarchy");
    });

    it("allows valid hierarchy when no cycle exists", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID_2 }] }) // Parent exists
        .mockResolvedValueOnce({ rows: [] }) // Cycle check: empty (no cycle)
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }); // Update success

      await updateAdminCategory(TEST_CATEGORY_ID, {
        name: "Sub Category",
        slug: "sub-category",
        parentId: TEST_CATEGORY_ID_2,
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.categories SET"),
        expect.arrayContaining([TEST_CATEGORY_ID]),
      );
    });

    it("rejects non-existent parent category", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Parent does not exist

      await expect(
        createAdminCategory({
          name: "Orphan Category",
          slug: "orphan-category",
          parentId: TEST_CATEGORY_ID_2,
        }),
      ).rejects.toThrow("Parent category does not exist");
    });
  });

  describe("archive and restore product", () => {
    it("sets product status to archived without deleting variants", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_ID }] });
      await archiveAdminProduct(TEST_PRODUCT_ID);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.products SET status = 'archived'"),
        [TEST_PRODUCT_ID],
      );
    });

    it("restores archived product back to draft", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_ID }] });
      await restoreAdminProduct(TEST_PRODUCT_ID);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.products SET status = 'draft'"),
        [TEST_PRODUCT_ID],
      );
    });
  });

  describe("deleteAdminCategoryIfSafe (Atomic)", () => {
    it("deletes unreferenced category safely via atomic conditional DELETE", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }); // 1 row deleted atomically

      await deleteAdminCategoryIfSafe(TEST_CATEGORY_ID);

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM public.categories"),
        [TEST_CATEGORY_ID],
      );
      const sql = mockDb.query.mock.calls[0][0];
      expect(sql).toContain("NOT EXISTS (");
      expect(sql).toContain("public.product_categories");
      expect(sql).toContain("public.categories WHERE parent_id = $1");
    });

    it("denies category deletion when referenced by products", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Atomic delete affected 0 rows
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }) // Category exists
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }); // 5 products linked

      await expect(deleteAdminCategoryIfSafe(TEST_CATEGORY_ID)).rejects.toThrow(
        "Cannot delete category: Category is associated with one or more products.",
      );
    });

    it("denies category deletion when child categories exist", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Atomic delete affected 0 rows
        .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY_ID }] }) // Category exists
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // 0 products linked
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }); // 2 children exist

      await expect(deleteAdminCategoryIfSafe(TEST_CATEGORY_ID)).rejects.toThrow(
        "Cannot delete category: Category has child subcategories.",
      );
    });
  });

  describe("Runtime Input Validation", () => {
    it("validates UUIDs correctly and rejects invalid UUIDs", () => {
      expect(validateUuid(TEST_PRODUCT_ID, "productId")).toBe(TEST_PRODUCT_ID);
      expect(() => validateUuid("not-a-uuid", "productId")).toThrow(CatalogValidationError);
      expect(() => validateUuid("12345", "productId")).toThrow(CatalogValidationError);
      expect(() => validateUuid(null, "productId")).toThrow(CatalogValidationError);
    });

    it("validates status and rejects invalid values", () => {
      expect(validateStatus("draft")).toBe("draft");
      expect(validateStatus("active")).toBe("active");
      expect(validateStatus("archived")).toBe("archived");
      expect(() => validateStatus("deleted")).toThrow(CatalogValidationError);
      expect(() => validateStatus("")).toThrow(CatalogValidationError);
    });

    it("validates slugs and rejects invalid formats", () => {
      expect(validateSlug("valid-slug-123")).toBe("valid-slug-123");
      expect(() => validateSlug("Invalid Slug!")).toThrow(CatalogValidationError);
      expect(() => validateSlug("UPPERCASE")).toThrow(CatalogValidationError);
      expect(() => validateSlug("-leading-hyphen")).toThrow(CatalogValidationError);
      expect(() => validateSlug("trailing-hyphen-")).toThrow(CatalogValidationError);
    });

    it("validates integers and rejects non-integers, NaN, and negative values", () => {
      expect(validateInteger(100, "price")).toBe(100);
      expect(validateInteger(0, "price")).toBe(0);
      expect(() => validateInteger(-5, "price")).toThrow(CatalogValidationError);
      expect(() => validateInteger(NaN, "price")).toThrow(CatalogValidationError);
      expect(() => validateInteger(12.5, "price")).toThrow(CatalogValidationError);
      expect(() => validateInteger("100", "price")).toThrow(CatalogValidationError);
      expect(validateInteger(null, "compareAt", { allowNull: true })).toBeNull();
    });

    it("validates booleans and rejects non-booleans", () => {
      expect(validateBoolean(true, "isDefault")).toBe(true);
      expect(validateBoolean(false, "isDefault")).toBe(false);
      expect(() => validateBoolean("true", "isDefault")).toThrow(CatalogValidationError);
      expect(() => validateBoolean(1, "isDefault")).toThrow(CatalogValidationError);
      expect(() => validateBoolean(null, "isDefault")).toThrow(CatalogValidationError);
    });
  });
});
