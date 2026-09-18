import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const mockDal = vi.hoisted(() => ({
  listAdminProducts: vi.fn(),
  listAdminProductsPage: vi.fn(),
  getAdminProduct: vi.fn(),
  listAdminCategories: vi.fn(),
  getAdminCategory: vi.fn(),
  getAdminCatalogOverview: vi.fn(),
}));

const mockNavigation = vi.hoisted(() => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => {
  class MockAdminAuthError extends Error {
    constructor(message: string, public readonly code: string) {
      super(message);
      this.name = "AdminAuthError";
    }
  }
  return {
    requireAdmin: mockAuth.requireAdmin,
    AdminAuthError: MockAdminAuthError,
  };
});

vi.mock("@/lib/db/admin-catalog", () => ({
  listAdminProducts: mockDal.listAdminProducts,
  listAdminProductsPage: mockDal.listAdminProductsPage,
  getAdminProduct: mockDal.getAdminProduct,
  listAdminCategories: mockDal.listAdminCategories,
  getAdminCategory: mockDal.getAdminCategory,
  getAdminCatalogOverview: mockDal.getAdminCatalogOverview,
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  redirect: mockNavigation.redirect,
  notFound: mockNavigation.notFound,
}));

vi.mock("@/components/admin/ProductNewForm", () => ({
  ProductNewForm: () => null,
}));

vi.mock("@/components/admin/ProductEditForm", () => ({
  ProductEditForm: () => null,
}));

vi.mock("@/components/admin/CategoryManager", () => ({
  CategoryManager: () => null,
}));

vi.mock("@/lib/db/media-v1", () => ({
  listMediaLibraryAssets: vi.fn().mockResolvedValue({ items: [], totalCount: 0, limit: 24, offset: 0 }),
}));

vi.mock("@/components/admin/media/MediaLibraryClient", () => ({
  MediaLibraryClient: () => null,
}));

import { AdminAuthError } from "@/lib/auth/admin";
import AdminProductsPage from "../admin/products/page";
import ProductNewPage from "../admin/products/new/page";
import ProductDetailPage from "../admin/products/[id]/page";
import AdminCategoriesPage from "../admin/categories/page";
import { AdminIndexPageContent } from "../admin/page";
import { AdminMediaPageContent } from "../admin/media/page";
import { listMediaLibraryAssets } from "@/lib/db/media-v1";

describe("Admin Pages Direct Authorization Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testParams = Promise.resolve({ country: "us", locale: "en" });
  const detailParams = Promise.resolve({
    country: "us",
    locale: "en",
    id: "11111111-1111-4111-8111-111111111111",
  });

  describe("Anonymous callers (no admin identity)", () => {
    beforeEach(() => {
      mockAuth.requireAdmin.mockRejectedValue(
        new AdminAuthError("Admin authorization required.", "UNAUTHENTICATED"),
      );
    });

    it("products page: rejects before calling listAdminProductsPage (DAL calls = 0)", async () => {
      await expect(AdminProductsPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminProductsPage).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("new product page: rejects before calling listAdminCategories (DAL calls = 0)", async () => {
      await expect(ProductNewPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("product detail page: rejects before calling getAdminProduct or listAdminCategories (DAL calls = 0)", async () => {
      await expect(
        ProductDetailPage({ params: detailParams }),
      ).rejects.toThrow("Admin authorization required.");
      expect(mockDal.getAdminProduct).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("categories page: rejects before calling listAdminCategories (DAL calls = 0)", async () => {
      await expect(AdminCategoriesPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("admin root overview page: rejects before calling getAdminCatalogOverview", async () => {
      await expect(
        AdminIndexPageContent({ params: testParams }),
      ).rejects.toThrow("Admin authorization required.");
      expect(mockDal.getAdminCatalogOverview).not.toHaveBeenCalled();
      expect(mockNavigation.redirect).not.toHaveBeenCalled();
    });

    it("media library page: rejects before calling listMediaLibraryAssets (DAL calls = 0)", async () => {
      await expect(
        AdminMediaPageContent({ params: testParams, searchParams: Promise.resolve({}) }),
      ).rejects.toThrow("Admin authorization required.");
      expect(listMediaLibraryAssets).not.toHaveBeenCalled();
    });
  });

  describe("Customer callers (role = customer)", () => {
    beforeEach(() => {
      mockAuth.requireAdmin.mockRejectedValue(
        new AdminAuthError("Admin authorization required.", "FORBIDDEN"),
      );
    });

    it("products page: customer request blocks DAL (calls = 0)", async () => {
      await expect(AdminProductsPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminProductsPage).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("categories page: customer request blocks DAL (calls = 0)", async () => {
      await expect(AdminCategoriesPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });
  });

  describe("Auth infrastructure outage (fail closed)", () => {
    beforeEach(() => {
      mockAuth.requireAdmin.mockRejectedValue(
        new AdminAuthError(
          "Auth service infrastructure outage: ECONNREFUSED",
          "INFRASTRUCTURE_ERROR",
        ),
      );
    });

    it("fails closed on products page (DAL calls = 0)", async () => {
      await expect(AdminProductsPage({ params: testParams })).rejects.toThrow(
        "Auth service infrastructure outage",
      );
      expect(mockDal.listAdminProductsPage).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("fails closed on product detail page (DAL calls = 0)", async () => {
      await expect(
        ProductDetailPage({ params: detailParams }),
      ).rejects.toThrow("Auth service infrastructure outage");
      expect(mockDal.getAdminProduct).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });
  });

  describe("Profile database outage (fail closed)", () => {
    beforeEach(() => {
      mockAuth.requireAdmin.mockRejectedValue(
        new Error("PostgreSQL pool connection timeout"),
      );
    });

    it("fails closed on products page (DAL calls = 0)", async () => {
      await expect(AdminProductsPage({ params: testParams })).rejects.toThrow(
        "PostgreSQL pool connection timeout",
      );
      expect(mockDal.listAdminProductsPage).not.toHaveBeenCalled();
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });

    it("fails closed on categories page (DAL calls = 0)", async () => {
      await expect(AdminCategoriesPage({ params: testParams })).rejects.toThrow(
        "PostgreSQL pool connection timeout",
      );
      expect(mockDal.listAdminCategories).not.toHaveBeenCalled();
    });
  });

  describe("Verified Admin callers", () => {
    beforeEach(() => {
      mockAuth.requireAdmin.mockResolvedValue({
        userId: "admin-uuid-1",
        email: "admin@mirzafootwear.com",
        profile: {
          id: "admin-uuid-1",
          role: "admin",
          first_name: "Mirza",
          last_name: "Admin",
          phone: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      mockDal.listAdminProductsPage.mockResolvedValue({
        products: [],
        totalCount: 0,
        page: 1,
        pageSize: 30,
        totalPages: 1,
      });
      mockDal.getAdminCatalogOverview.mockResolvedValue({
        metrics: {
          totalProducts: 0,
          activeProducts: 0,
          draftProducts: 0,
          archivedProducts: 0,
          totalCategories: 0,
          managedMediaCount: 0,
          totalVariants: 0,
          totalStock: 0,
          activeZeroStockProducts: 0,
        },
        recentProducts: [],
      });
      mockDal.listAdminCategories.mockResolvedValue([]);
      mockDal.getAdminProduct.mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        name: "Test Shoe",
        slug: "test-shoe",
        sku: "TEST-01",
        description: null,
        descriptionHtml: null,
        status: "draft",
        metaTitle: null,
        metaDescription: null,
        metaKeywords: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        variants: [],
      });
    });

    it("products page: executes listAdminProductsPage and listAdminCategories when authorized", async () => {
      const res = await AdminProductsPage({ params: testParams });
      expect(res).toBeDefined();
      expect(mockDal.listAdminProductsPage).toHaveBeenCalledTimes(1);
      expect(mockDal.listAdminCategories).toHaveBeenCalledTimes(1);
    });

    it("new product page: executes listAdminCategories when authorized", async () => {
      const res = await ProductNewPage({ params: testParams });
      expect(res).toBeDefined();
      expect(mockDal.listAdminCategories).toHaveBeenCalledTimes(1);
    });

    it("product detail page: executes getAdminProduct and listAdminCategories when authorized", async () => {
      const res = await ProductDetailPage({ params: detailParams });
      expect(res).toBeDefined();
      expect(mockDal.getAdminProduct).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
      );
      expect(mockDal.listAdminCategories).toHaveBeenCalledTimes(1);
    });

    it("categories page: executes listAdminCategories when authorized", async () => {
      const res = await AdminCategoriesPage({ params: testParams });
      expect(res).toBeDefined();
      expect(mockDal.listAdminCategories).toHaveBeenCalledTimes(1);
    });

    it("admin root overview page: executes getAdminCatalogOverview without redirect when authorized", async () => {
      const res = await AdminIndexPageContent({ params: testParams });
      expect(res).toBeDefined();
      expect(mockDal.getAdminCatalogOverview).toHaveBeenCalledTimes(1);
      expect(mockNavigation.redirect).not.toHaveBeenCalled();
    });

    it("media library page: executes listMediaLibraryAssets when authorized", async () => {
      const res = await AdminMediaPageContent({
        params: testParams,
        searchParams: Promise.resolve({}),
      });
      expect(res).toBeDefined();
      expect(listMediaLibraryAssets).toHaveBeenCalledTimes(1);
    });
  });
});
