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
  getAdminCatalogOverview,
  listAdminProductsPage,
} from "../admin-catalog";

const TEST_PRODUCT_ID = "11111111-1111-4111-8111-111111111111";
const TEST_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

describe("Admin Catalog Phase 7 DAL Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAdminCatalogOverview", () => {
    it("executes exactly 2 bounded SQL queries and maps metrics and recent products", async () => {
      mockDb.query
        // 1. metrics query
        .mockResolvedValueOnce({
          rows: [
            {
              total_products: 69,
              active_products: 31,
              draft_products: 35,
              archived_products: 3,
              total_categories: 4,
              managed_media_count: 85,
              total_variants: 217,
              total_stock: 1450,
              active_zero_stock_products: 2,
              total_orders: 12,
              orders_today: 3,
              guest_orders: 4,
              registered_customers: 8,
            },
          ],
        })
        // 2. recent products query
        .mockResolvedValueOnce({
          rows: [
            {
              id: TEST_PRODUCT_ID,
              name: "The Sovereign Wholecut Oxford",
              slug: "sovereign-wholecut-oxford",
              sku: "SHOE-001",
              status: "active",
              updated_at: new Date("2026-09-18T10:00:00Z"),
              variant_count: 5,
              total_stock: 40,
              hero_storage_path: "products/prod-1/hero.webp",
            },
          ],
        });

      const overview = await getAdminCatalogOverview();

      expect(mockDb.query).toHaveBeenCalledTimes(2);

      // Verify metrics
      expect(overview.metrics).toEqual({
        totalProducts: 69,
        activeProducts: 31,
        draftProducts: 35,
        archivedProducts: 3,
        totalCategories: 4,
        managedMediaCount: 85,
        totalVariants: 217,
        totalStock: 1450,
        activeZeroStockProducts: 2,
        totalOrders: 12,
        ordersToday: 3,
        guestOrders: 4,
        registeredCustomers: 8,
      });

      // Verify recent products with Media Contract v1 delivery
      expect(overview.recentProducts).toHaveLength(1);
      expect(overview.recentProducts[0].name).toBe("The Sovereign Wholecut Oxford");
      expect(overview.recentProducts[0].heroThumbnailUrl).toContain("products/prod-1/hero.webp");
      expect(overview.recentProducts[0].variantCount).toBe(5);
      expect(overview.recentProducts[0].totalStock).toBe(40);

      // Confirm neither query referenced public.product_images
      const sqlCalls = mockDb.query.mock.calls.map((c: unknown[]) => String(c[0]));
      for (const sql of sqlCalls) {
        expect(sql).not.toContain("product_images");
        expect(sql).not.toContain("SELECT * FROM public.products");
      }
    });

    it("handles empty catalog database with safe defaults", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const overview = await getAdminCatalogOverview();

      expect(overview.metrics.totalProducts).toBe(0);
      expect(overview.metrics.activeProducts).toBe(0);
      expect(overview.metrics.totalOrders).toBe(0);
      expect(overview.metrics.ordersToday).toBe(0);
      expect(overview.recentProducts).toHaveLength(0);
    });
  });

  describe("listAdminProductsPage", () => {
    it("executes single bounded query with default pagination, filters, and Media Contract hero", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_PRODUCT_ID,
            name: "Classic Derby",
            slug: "classic-derby",
            sku: "DRB-001",
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
            variant_count: 6,
            min_price_in_cents: 18000,
            max_price_in_cents: 22000,
            total_stock: 60,
            total_count: 45,
            categories: [{ id: TEST_CATEGORY_ID, name: "Formal", slug: "formal" }],
            hero_storage_path: "products/prod-1/hero.webp",
          },
        ],
      });

      const result = await listAdminProductsPage({
        page: 1,
        pageSize: 30,
        query: "derby",
        status: "active",
        categoryId: TEST_CATEGORY_ID,
        sort: "name_asc",
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];

      // Check parameter passing
      expect(params).toContain("%derby%");
      expect(params).toContain("active");
      expect(params).toContain(TEST_CATEGORY_ID);
      expect(params).toContain(30); // limit
      expect(params).toContain(0);  // offset

      // Check SQL structure
      expect(sql).toContain("storage_provider != 'legacy_public'");
      expect(sql).not.toContain("product_images");

      // Check mapped result
      expect(result.totalCount).toBe(45);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(30);
      expect(result.totalPages).toBe(2);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].heroThumbnailUrl).toContain("products/prod-1/hero.webp");
      expect(result.products[0].name).toBe("Classic Derby");
      expect(result.products[0].minPriceInCents).toBe(18000);
      expect(result.products[0].maxPriceInCents).toBe(22000);
    });

    it("falls back to count query if offset exceeds row count on deep page", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 12 }] });

      const result = await listAdminProductsPage({
        page: 5,
        pageSize: 30,
      });

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.products).toHaveLength(0);
      expect(result.totalCount).toBe(12);
      expect(result.page).toBe(5);
    });
  });
});
