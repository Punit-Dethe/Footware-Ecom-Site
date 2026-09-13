import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockUpdateTag,
  mockCreateSignedUrl,
  mockDeleteStorageObjects,
  mockDownloadStorageObject,
  mockInsertProductMedia,
  mockSetHeroMediaAtomic,
  mockReorderProductMedia,
  mockUpdateMediaAltText,
  mockDeleteProductMedia,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockCreateSignedUrl: vi.fn(),
  mockDeleteStorageObjects: vi.fn(),
  mockDownloadStorageObject: vi.fn(),
  mockInsertProductMedia: vi.fn(),
  mockSetHeroMediaAtomic: vi.fn(),
  mockReorderProductMedia: vi.fn(),
  mockUpdateMediaAltText: vi.fn(),
  mockDeleteProductMedia: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: mockUpdateTag,
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mockRequireAdmin,
  AdminAuthError: class AdminAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AdminAuthError";
    }
  },
}));

vi.mock("@/lib/media/storage-admin", () => ({
  createSignedMediaUploadUrl: mockCreateSignedUrl,
  deleteStorageObjects: mockDeleteStorageObjects,
  downloadStorageObject: mockDownloadStorageObject,
  generateMediaStoragePath: vi.fn((productId, ext) => ({
    mediaId: "test-media-123",
    storagePath: `products/${productId}/test-media-123/original.${ext}`,
  })),
}));

vi.mock("@/lib/db/media", () => ({
  insertProductMedia: mockInsertProductMedia,
  setHeroMediaAtomic: mockSetHeroMediaAtomic,
  reorderProductMedia: mockReorderProductMedia,
  updateMediaAltText: mockUpdateMediaAltText,
  deleteProductMedia: mockDeleteProductMedia,
}));

import {
  deleteProductMediaAction,
  reorderProductMediaAction,
  requestProductMediaUploadAction,
  setHeroMediaAction,
  updateMediaAltTextAction,
} from "../admin-media";

describe("Admin Media Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin-1", email: "admin@mirza.com", role: "admin" });
    mockDeleteStorageObjects.mockResolvedValue([]);
  });

  describe("requestProductMediaUploadAction", () => {
    it("rejects unauthorized user", async () => {
      mockRequireAdmin.mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));

      const res = await requestProductMediaUploadAction(
        "prod-1",
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("rejects unsupported mime types", async () => {
      const res = await requestProductMediaUploadAction(
        "prod-1",
        "malicious.exe",
        "application/x-msdownload",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Disallowed image type");
    });

    it("rejects files exceeding 10 MB limit", async () => {
      const res = await requestProductMediaUploadAction(
        "prod-1",
        "large.png",
        "image/png",
        11 * 1024 * 1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("exceeds the 10 MB limit");
    });

    it("returns signed upload URL and storage path on valid request", async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        signedUrl: "https://supabase.co/storage/v1/upload/sign/product-media/shoe.webp?token=xyz",
        token: "xyz",
      });

      const res = await requestProductMediaUploadAction(
        "prod-1",
        "derby.webp",
        "image/webp",
        500_000,
      );

      expect(res.success).toBe(true);
      expect(res.signedUrl).toBeDefined();
      expect(res.storagePath).toContain("products/prod-1/");
      expect(res.mediaId).toBeDefined();
    });
  });

  describe("setHeroMediaAction", () => {
    it("updates hero image atomically and invalidates public catalog cache", async () => {
      mockSetHeroMediaAtomic.mockResolvedValueOnce(undefined);

      const res = await setHeroMediaAction("prod-1", "med-2");
      expect(res.success).toBe(true);
      expect(mockSetHeroMediaAtomic).toHaveBeenCalledWith("prod-1", "med-2");
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("reorderProductMediaAction", () => {
    it("reorders media items deterministically and invalidates cache", async () => {
      mockReorderProductMedia.mockResolvedValueOnce(undefined);

      const res = await reorderProductMediaAction("prod-1", ["med-2", "med-1", "med-3"]);
      expect(res.success).toBe(true);
      expect(mockReorderProductMedia).toHaveBeenCalledWith("prod-1", ["med-2", "med-1", "med-3"]);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("updateMediaAltTextAction", () => {
    it("updates alt text and invalidates cache", async () => {
      mockUpdateMediaAltText.mockResolvedValueOnce(undefined);

      const res = await updateMediaAltTextAction("prod-1", "med-1", "Updated Alt Text");
      expect(res.success).toBe(true);
      expect(mockUpdateMediaAltText).toHaveBeenCalledWith("prod-1", "med-1", "Updated Alt Text");
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("deleteProductMediaAction", () => {
    it("deletes from DB, triggers best-effort storage cleanup, and invalidates cache", async () => {
      mockDeleteProductMedia.mockResolvedValueOnce({
        deletedMediaId: "med-1",
        storagePathsToDelete: ["products/prod-1/med-1.webp", "products/prod-1/variants/med-1/320.webp"],
        newHeroId: "med-2",
      });

      const res = await deleteProductMediaAction("prod-1", "med-1");
      expect(res.success).toBe(true);
      expect(mockDeleteProductMedia).toHaveBeenCalledWith("prod-1", "med-1");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([
        "products/prod-1/med-1.webp",
        "products/prod-1/variants/med-1/320.webp",
      ]);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });
});
