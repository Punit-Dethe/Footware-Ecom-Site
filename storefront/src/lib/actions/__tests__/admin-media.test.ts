import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockUpdateTag,
  mockCreateSignedUrl,
  mockDeleteStorageObjects,
  mockDownloadStorageObject,
  mockQuery,
  mockInsertProductMedia,
  mockSetHeroMediaAtomic,
  mockReorderProductMedia,
  mockUpdateMediaAltText,
  mockDeleteProductMedia,
  mockSharp,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockCreateSignedUrl: vi.fn(),
  mockDeleteStorageObjects: vi.fn(),
  mockDownloadStorageObject: vi.fn(),
  mockQuery: vi.fn(),
  mockInsertProductMedia: vi.fn(),
  mockSetHeroMediaAtomic: vi.fn(),
  mockReorderProductMedia: vi.fn(),
  mockUpdateMediaAltText: vi.fn(),
  mockDeleteProductMedia: vi.fn(),
  mockSharp: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: mockUpdateTag,
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mockRequireAdmin,
  AdminAuthError: class AdminAuthError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.name = "AdminAuthError";
      this.code = code;
    }
  },
}));

vi.mock("@/lib/db", () => ({
  query: mockQuery,
}));

vi.mock("@/lib/media/storage-admin", () => ({
  createSignedMediaUploadUrl: mockCreateSignedUrl,
  deleteStorageObjects: mockDeleteStorageObjects,
  downloadStorageObject: mockDownloadStorageObject,
}));

vi.mock("@/lib/db/media", () => ({
  insertProductMedia: mockInsertProductMedia,
  setHeroMediaAtomic: mockSetHeroMediaAtomic,
  reorderProductMedia: mockReorderProductMedia,
  updateMediaAltText: mockUpdateMediaAltText,
  deleteProductMedia: mockDeleteProductMedia,
}));

vi.mock("sharp", () => ({
  default: mockSharp,
}));

import {
  deleteProductMediaAction,
  finalizeProductMediaUploadAction,
  reorderProductMediaAction,
  requestProductMediaUploadAction,
  setHeroMediaAction,
  updateMediaAltTextAction,
} from "../admin-media";
import { AdminAuthError } from "@/lib/auth/admin";

const VALID_PROD_ID = "11111111-1111-4111-8111-111111111111";
const VALID_MEDIA_ID = "22222222-2222-4222-8222-222222222222";

describe("Admin Media Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin-1", email: "admin@mirza.com", role: "admin" });
    mockQuery.mockResolvedValue({ rows: [{ id: VALID_PROD_ID }] });
    mockDeleteStorageObjects.mockResolvedValue({ success: true });
  });

  describe("requestProductMediaUploadAction", () => {
    it("denies anonymous user", async () => {
      mockRequireAdmin.mockRejectedValueOnce(
        new AdminAuthError("Admin authorization required.", "FORBIDDEN"),
      );

      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin authorization required");
    });

    it("denies normal customer without admin role", async () => {
      mockRequireAdmin.mockRejectedValueOnce(
        new AdminAuthError("Admin authorization required.", "FORBIDDEN"),
      );

      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin authorization required");
    });

    it("rejects invalid product UUID", async () => {
      const res = await requestProductMediaUploadAction(
        "invalid-uuid-format",
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("Valid product ID (UUID) is required");
    });

    it("rejects nonexistent product in database", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Product not found

      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("does not exist");
    });

    it("sanitizes raw database infrastructure error and does not leak schema or table names", async () => {
      mockQuery.mockRejectedValueOnce(
        new Error('relation "public.products" does not exist'),
      );

      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "shoe.jpg",
        "image/jpeg",
        1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe("An unexpected system error occurred. Media changes were not saved.");
      expect(res.error).not.toContain('relation "public.products" does not exist');
    });

    it("rejects zero, negative, NaN, and infinite file sizes", async () => {
      for (const badSize of [0, -500, NaN, Infinity, -Infinity, 12.5]) {
        const res = await requestProductMediaUploadAction(
          VALID_PROD_ID,
          "shoe.jpg",
          "image/jpeg",
          badSize,
        );
        expect(res.success).toBe(false);
        expect(res.error).toContain("File size must be a positive integer");
      }
    });

    it("rejects file exceeding 10 MB limit", async () => {
      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "large.png",
        "image/png",
        10 * 1024 * 1024 + 1,
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("exceeds the 10 MB limit");
    });

    it("rejects disallowed MIME types and SVG explicitly", async () => {
      const badTypes = [
        { mime: "image/svg+xml", file: "vector.svg" },
        { mime: "image/gif", file: "animation.gif" },
        { mime: "application/pdf", file: "doc.pdf" },
        { mime: "image/bmp", file: "bitmap.bmp" },
      ];

      for (const item of badTypes) {
        const res = await requestProductMediaUploadAction(
          VALID_PROD_ID,
          item.file,
          item.mime,
          1024,
        );
        expect(res.success).toBe(false);
      }
    });

    it("enforces server-controlled extension mapping regardless of client filename", async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        signedUrl: "https://supabase.co/upload?token=xyz",
        token: "xyz",
        path: "products/test",
      });

      // Client passes filename with .png extension but MIME image/jpeg
      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "trick-filename.png",
        "image/jpeg",
        5000,
      );

      expect(res.success).toBe(true);
      expect(res.storagePath).toMatch(
        new RegExp(`^products/${VALID_PROD_ID}/[0-9a-f-]{36}/original\\.jpg$`),
      );
    });

    it("generates signed upload authorization on valid admin request", async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        signedUrl: "https://supabase.co/storage/v1/upload/sign/product-media/shoe.webp?token=xyz",
        token: "xyz",
        path: "path",
      });

      const res = await requestProductMediaUploadAction(
        VALID_PROD_ID,
        "derby.webp",
        "image/webp",
        500_000,
      );

      expect(res.success).toBe(true);
      expect(res.signedUrl).toBeDefined();
      expect(res.storagePath).toContain(`products/${VALID_PROD_ID}/`);
      expect(res.mediaId).toBeDefined();
    });
  });

  describe("finalizeProductMediaUploadAction", () => {
    const validStoragePath = `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`;

    function setupSharpMock(metadata: any, stats?: any) {
      mockSharp.mockReturnValue({
        metadata: vi.fn().mockResolvedValue(metadata),
        stats: vi.fn().mockResolvedValue(stats || { dominant: { r: 200, g: 150, b: 100 } }),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from("lqip-bytes")),
      });
    }

    it("rejects invalid product UUID or media UUID", async () => {
      const res1 = await finalizeProductMediaUploadAction({
        productId: "bad-id",
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "shoe.webp",
        mimeType: "image/webp",
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toContain("Valid product ID (UUID) is required");

      const res2 = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: "bad-id",
        storagePath: validStoragePath,
        originalFilename: "shoe.webp",
        mimeType: "image/webp",
      });
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("Valid media ID (UUID) is required");
    });

    it("rejects path binding mismatch, traversal, or cross-entity manipulation", async () => {
      const badPaths = [
        `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/../../etc/passwd`,
        `products/99999999-9999-4999-8999-999999999999/${VALID_MEDIA_ID}/original.webp`,
        `products/${VALID_PROD_ID}/99999999-9999-4999-8999-999999999999/original.webp`,
        `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/malicious.exe`,
        `random/unrelated/path.webp`,
      ];

      for (const badPath of badPaths) {
        const res = await finalizeProductMediaUploadAction({
          productId: VALID_PROD_ID,
          mediaId: VALID_MEDIA_ID,
          storagePath: badPath,
          originalFilename: "test.webp",
          mimeType: "image/webp",
        });
        expect(res.success).toBe(false);
        expect(res.error).toContain("Invalid storage path");
      }
    });

    it("rejects when product does not exist in database", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "shoe.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("does not exist");
    });

    it("cleans up storage object and fails if uploaded bytes exceed 10 MB", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.alloc(11 * 1024 * 1024));

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "large.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("exceeds the 10 MB limit");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validStoragePath]);
    });

    it("rejects corrupt/fake image bytes and cleans up storage object", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("not-a-real-image"));
      mockSharp.mockReturnValue({
        metadata: vi.fn().mockRejectedValueOnce(new Error("Input buffer contains unsupported image format")),
      });

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "corrupt.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Image validation failed");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validStoragePath]);
    });

    it("rejects MIME type mismatch between declared and actual decoded bytes", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("png-bytes-here"));
      // Sharp decodes format as 'png'
      setupSharpMock({ width: 800, height: 600, format: "png" });

      // Client declared 'image/webp'
      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`,
        originalFilename: "fake.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("MIME type mismatch");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([
        `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`,
      ]);
    });

    it("sanitizes Storage download errors and does not leak internal Storage SQL/error details to browser", async () => {
      mockDownloadStorageObject.mockRejectedValueOnce(
        new Error("bucket product-media internal SQL error XYZ"),
      );

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "shoe.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Uploaded image could not be retrieved. Please retry the upload.");
      expect(res.error).not.toContain("bucket product-media internal SQL error XYZ");
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("sanitizes raw database infrastructure errors and does not leak table/schema names to browser", async () => {
      mockQuery.mockRejectedValueOnce(
        new Error('relation "public.products" does not exist'),
      );

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "shoe.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("An unexpected system error occurred. Media changes were not saved.");
      expect(res.error).not.toContain('relation "public.products" does not exist');
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("rejects when path extension is .jpg but decoded bytes are PNG (even if client declares image/png)", async () => {
      const jpgPath = `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.jpg`;
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("png-bytes"));
      setupSharpMock({ width: 800, height: 600, format: "png" });

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: jpgPath,
        originalFilename: "fake.jpg",
        mimeType: "image/png",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("MIME type mismatch");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([jpgPath]);
      expect(mockInsertProductMedia).not.toHaveBeenCalled();
      expect(mockUpdateTag).not.toHaveBeenCalled();
    });

    it("passes when path extension is .webp, decoded bytes are WebP, and declared MIME is image/webp", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("valid-webp-bytes"));
      setupSharpMock({ width: 800, height: 600, format: "webp" });
      mockInsertProductMedia.mockResolvedValueOnce({ id: VALID_MEDIA_ID });

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "derby.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(true);
      expect(res.mediaId).toBe(VALID_MEDIA_ID);
      expect(mockInsertProductMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          id: VALID_MEDIA_ID,
          productId: VALID_PROD_ID,
          storagePath: validStoragePath,
          mimeType: "image/webp",
          width: 800,
          height: 600,
        }),
      );
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("cleans up storage object if database insertion fails", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("valid-webp-bytes"));
      setupSharpMock({ width: 800, height: 600, format: "webp" });
      mockInsertProductMedia.mockRejectedValueOnce(new Error("Database connection lost"));

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "derby.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("An unexpected system error occurred. Media changes were not saved.");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validStoragePath]);
    });

    it("successfully validates and inserts media row with authoritative MIME", async () => {
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("valid-webp-bytes"));
      setupSharpMock({ width: 800, height: 600, format: "webp" });
      mockInsertProductMedia.mockResolvedValueOnce({ id: VALID_MEDIA_ID });

      const res = await finalizeProductMediaUploadAction({
        productId: VALID_PROD_ID,
        mediaId: VALID_MEDIA_ID,
        storagePath: validStoragePath,
        originalFilename: "derby.webp",
        mimeType: "image/webp",
      });

      expect(res.success).toBe(true);
      expect(res.mediaId).toBe(VALID_MEDIA_ID);
      expect(mockInsertProductMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          id: VALID_MEDIA_ID,
          productId: VALID_PROD_ID,
          storagePath: validStoragePath,
          mimeType: "image/webp",
          width: 800,
          height: 600,
        }),
      );
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("setHeroMediaAction", () => {
    it("updates hero image atomically and invalidates public catalog cache", async () => {
      mockSetHeroMediaAtomic.mockResolvedValueOnce(undefined);

      const res = await setHeroMediaAction(VALID_PROD_ID, VALID_MEDIA_ID);
      expect(res.success).toBe(true);
      expect(mockSetHeroMediaAtomic).toHaveBeenCalledWith(VALID_PROD_ID, VALID_MEDIA_ID);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("reorderProductMediaAction", () => {
    it("reorders media items deterministically and invalidates cache", async () => {
      mockReorderProductMedia.mockResolvedValueOnce(undefined);

      const res = await reorderProductMediaAction(VALID_PROD_ID, [VALID_MEDIA_ID]);
      expect(res.success).toBe(true);
      expect(mockReorderProductMedia).toHaveBeenCalledWith(VALID_PROD_ID, [VALID_MEDIA_ID]);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("updateMediaAltTextAction", () => {
    it("updates alt text and invalidates cache", async () => {
      mockUpdateMediaAltText.mockResolvedValueOnce(undefined);

      const res = await updateMediaAltTextAction(VALID_PROD_ID, VALID_MEDIA_ID, "Updated Alt Text");
      expect(res.success).toBe(true);
      expect(mockUpdateMediaAltText).toHaveBeenCalledWith(VALID_PROD_ID, VALID_MEDIA_ID, "Updated Alt Text");
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });

  describe("deleteProductMediaAction", () => {
    it("deletes from DB first, awaits storage cleanup, and invalidates cache", async () => {
      mockDeleteProductMedia.mockResolvedValueOnce({
        deletedMediaId: VALID_MEDIA_ID,
        storagePathsToDelete: [
          `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`,
          `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/variants/320.webp`,
        ],
        newHeroId: null,
      });
      mockDeleteStorageObjects.mockResolvedValueOnce({ success: true });

      const res = await deleteProductMediaAction(VALID_PROD_ID, VALID_MEDIA_ID);
      expect(res.success).toBe(true);
      expect(mockDeleteProductMedia).toHaveBeenCalledWith(VALID_PROD_ID, VALID_MEDIA_ID);
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([
        `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`,
        `products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/variants/320.webp`,
      ]);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("does not roll back DB if storage cleanup encounters warning", async () => {
      mockDeleteProductMedia.mockResolvedValueOnce({
        deletedMediaId: VALID_MEDIA_ID,
        storagePathsToDelete: [`products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`],
        newHeroId: null,
      });
      mockDeleteStorageObjects.mockResolvedValueOnce({
        success: false,
        failedPaths: [`products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`],
        error: "Storage timeout",
      });

      const res = await deleteProductMediaAction(VALID_PROD_ID, VALID_MEDIA_ID);
      // DB was already committed, action succeeds with warning logged server-side
      expect(res.success).toBe(true);
      expect(res.warning).toBe(
        "Image was removed from the storefront, but background media cleanup requires attention.",
      );
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("returns success: true with safe warning when DB delete succeeds but Storage cleanup fails", async () => {
      mockDeleteProductMedia.mockResolvedValueOnce({
        deletedMediaId: VALID_MEDIA_ID,
        storagePathsToDelete: [`products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`],
        newHeroId: null,
      });
      mockDeleteStorageObjects.mockResolvedValueOnce({
        success: false,
        failedPaths: [`products/${VALID_PROD_ID}/${VALID_MEDIA_ID}/original.webp`],
        error: "bucket product-media internal SQL error XYZ",
      });

      const res = await deleteProductMediaAction(VALID_PROD_ID, VALID_MEDIA_ID);

      expect(res.success).toBe(true);
      expect(res.warning).toBe(
        "Image was removed from the storefront, but background media cleanup requires attention.",
      );
      expect(res.error).toBeUndefined();
      expect(JSON.stringify(res)).not.toContain("bucket product-media internal SQL error XYZ");
      expect(JSON.stringify(res)).not.toContain("products/");
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });
  });
});
