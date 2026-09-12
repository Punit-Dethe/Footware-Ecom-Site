import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const mockDal = vi.hoisted(() => ({
  createAdminProduct: vi.fn(),
  saveAdminProduct: vi.fn(),
  archiveAdminProduct: vi.fn(),
  restoreAdminProduct: vi.fn(),
  createAdminCategory: vi.fn(),
  updateAdminCategory: vi.fn(),
  deleteAdminCategoryIfSafe: vi.fn(),
}));

const mockCache = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mockAuth.requireAdmin,
  AdminAuthError: class AdminAuthError extends Error {
    constructor(message: string, public readonly code?: string) {
      super(message);
      this.name = "AdminAuthError";
    }
  },
}));

vi.mock("@/lib/db/admin-catalog", () => ({
  createAdminProduct: mockDal.createAdminProduct,
  saveAdminProduct: mockDal.saveAdminProduct,
  archiveAdminProduct: mockDal.archiveAdminProduct,
  restoreAdminProduct: mockDal.restoreAdminProduct,
  createAdminCategory: mockDal.createAdminCategory,
  updateAdminCategory: mockDal.updateAdminCategory,
  deleteAdminCategoryIfSafe: mockDal.deleteAdminCategoryIfSafe,
  CatalogValidationError: class CatalogValidationError extends Error {
    constructor(message: string, public readonly field?: string) {
      super(message);
    }
  },
}));

vi.mock("next/cache", () => ({
  updateTag: mockCache.updateTag,
  revalidatePath: mockCache.revalidatePath,
}));

import {
  archiveProductAction,
  createCategoryAction,
  createProductAction,
  deleteCategoryAction,
  restoreProductAction,
  saveProductAction,
} from "../admin-catalog";

describe("Admin Catalog Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authorization Enforcement", () => {
    it("denies unauthenticated/customer caller and does not call DAL or updateTag", async () => {
      mockAuth.requireAdmin.mockRejectedValue(new Error("Admin authorization required."));

      const res = await createProductAction({ name: "Shoe", slug: "shoe" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
      expect(mockDal.createAdminProduct).not.toHaveBeenCalled();
      expect(mockCache.updateTag).not.toHaveBeenCalled();
    });
  });

  describe("Cache Invalidation on Mutation", () => {
    it("invalidates 'catalog-public' tag after successful product creation", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.createAdminProduct.mockResolvedValue("prod-new-id");

      const res = await createProductAction({ name: "New Shoe", slug: "new-shoe" });
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("prod-new-id");
      expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
      expect(mockCache.revalidatePath).toHaveBeenCalledWith("/admin/products");
    });

    it("invalidates 'catalog-public' tag after successful product save", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.saveAdminProduct.mockResolvedValue({ id: "prod-1", name: "Updated Shoe" });

      const res = await saveProductAction("prod-1", { name: "Updated Shoe", slug: "updated-shoe" });
      expect(res.success).toBe(true);
      expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
      expect(mockCache.revalidatePath).toHaveBeenCalledWith("/admin/products");
      expect(mockCache.revalidatePath).toHaveBeenCalledWith("/admin/products/prod-1");
    });

    it("invalidates 'catalog-public' tag after archiving a product", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.archiveAdminProduct.mockResolvedValue(undefined);

      const res = await archiveProductAction("prod-1");
      expect(res.success).toBe(true);
      expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("invalidates 'catalog-public' tag after restoring an archived product", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.restoreAdminProduct.mockResolvedValue(undefined);

      const res = await restoreProductAction("prod-1");
      expect(res.success).toBe(true);
      expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("invalidates 'catalog-public' tag after category creation and safe deletion", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.createAdminCategory.mockResolvedValue("cat-1");
      mockDal.deleteAdminCategoryIfSafe.mockResolvedValue(undefined);

      const createRes = await createCategoryAction({ name: "Boots" });
      expect(createRes.success).toBe(true);
      expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");

      const deleteRes = await deleteCategoryAction("cat-1");
      expect(deleteRes.success).toBe(true);
      expect(mockCache.updateTag).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Sanitization", () => {
    it("does not expose raw PostgreSQL stack traces to the client on infrastructure error", async () => {
      mockAuth.requireAdmin.mockResolvedValue({ userId: "admin-1" });
      mockDal.saveAdminProduct.mockRejectedValue(
        new Error("FATAL: connection to server at 127.0.0.1 failed: Connection refused"),
      );

      const res = await saveProductAction("prod-1", { name: "Shoe", slug: "shoe" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("An unexpected system error occurred. Changes were not saved.");
      expect(res.error).not.toContain("FATAL");
      expect(mockCache.updateTag).not.toHaveBeenCalled();
    });

    it("does not leak auth infrastructure outage details to client actions", async () => {
      const { AdminAuthError } = await import("@/lib/auth/admin");
      mockAuth.requireAdmin.mockRejectedValue(
        new AdminAuthError(
          "Auth service infrastructure outage: fetch failed: ECONNREFUSED postgres.internal:5432",
          "INFRASTRUCTURE_ERROR",
        ),
      );

      const res = await createProductAction({ name: "Shoe", slug: "shoe" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Authorization service is temporarily unavailable.");
      expect(res.error).not.toContain("ECONNREFUSED");
      expect(res.error).not.toContain("postgres.internal");
      expect(mockDal.createAdminProduct).not.toHaveBeenCalled();
      expect(mockCache.updateTag).not.toHaveBeenCalled();
    });

    it("returns generic admin authorization required for forbidden errors without leaking details", async () => {
      const { AdminAuthError } = await import("@/lib/auth/admin");
      mockAuth.requireAdmin.mockRejectedValue(
        new AdminAuthError("User is not an authorized administrator.", "FORBIDDEN"),
      );

      const res = await saveProductAction("prod-1", { name: "Shoe", slug: "shoe" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
      expect(mockDal.saveAdminProduct).not.toHaveBeenCalled();
      expect(mockCache.updateTag).not.toHaveBeenCalled();
    });
  });
});
