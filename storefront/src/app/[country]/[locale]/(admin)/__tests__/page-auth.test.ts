import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const mockDal = vi.hoisted(() => ({
  listAdminProducts: vi.fn(),
  getAdminProduct: vi.fn(),
  listAdminCategories: vi.fn(),
  getAdminCategory: vi.fn(),
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
  getAdminProduct: mockDal.getAdminProduct,
  listAdminCategories: mockDal.listAdminCategories,
  getAdminCategory: mockDal.getAdminCategory,
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

import { AdminAuthError } from "@/lib/auth/admin";
import AdminProductsPage from "../admin/products/page";
import ProductNewPage from "../admin/products/new/page";
import ProductDetailPage from "../admin/products/[id]/page";
import AdminCategoriesPage from "../admin/categories/page";
import { AdminIndexPageContent } from "../admin/page";

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

    it("products page: rejects before calling listAdminProducts (DAL calls = 0)", async () => {
      await expect(AdminProductsPage({ params: testParams })).rejects.toThrow(
        "Admin authorization required.",
      );
      expect(mockDal.listAdminProducts).not.toHaveBeenCalled();
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

    it("admin root redirect page: rejects before redirecting", async () => {
      await expect(
        AdminIndexPageContent({ params: testParams }),
      ).rejects.toThrow("Admin authorization required.");
      expect(mockNavigation.redirect).not.toHaveBeenCalled();
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
      expect(mockDal.listAdminProducts).not.toHaveBeenCalled();
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
      expect(mockDal.listAdminProducts).not.toHaveBeenCalled();
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
      expect(mockDal.listAdminProducts).not.toHaveBeenCalled();
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
      mockDal.listAdminProducts.mockResolvedValue([]);
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

    it("products page: executes listAdminProducts when authorized", async () => {
      const res = await AdminProductsPage({ params: testParams });
      expect(res).toBeDefined();
      expect(mockDal.listAdminProducts).toHaveBeenCalledTimes(1);
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

    it("admin root redirect page: redirects to products when authorized", async () => {
      await AdminIndexPageContent({ params: testParams });
      expect(mockNavigation.redirect).toHaveBeenCalledWith("/us/en/admin/products");
    });
  });
});
