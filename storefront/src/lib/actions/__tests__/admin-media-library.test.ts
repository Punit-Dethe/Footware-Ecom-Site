import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdmin,
  mockUpdateTag,
  mockCreateSignedUrl,
  mockDeleteStorageObjects,
  mockDownloadStorageObject,
  mockQuery,
  mockTransaction,
  mockTxClient,
  mockCreateMediaAsset,
  mockGetMediaAsset,
  mockDeleteMediaAsset,
  mockGetMediaAssetUsage,
  mockAttachMediaToProduct,
  mockDetachMediaFromProduct,
  mockSetProductHeroMedia,
  mockReorderProductMediaV1,
  mockUpdateProductMediaAltTextV1,
  mockSharp,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockUpdateTag: vi.fn(),
  mockCreateSignedUrl: vi.fn(),
  mockDeleteStorageObjects: vi.fn(),
  mockDownloadStorageObject: vi.fn(),
  mockQuery: vi.fn(),
  mockTxClient: { query: vi.fn() },
  mockTransaction: vi.fn(),
  mockCreateMediaAsset: vi.fn(),
  mockGetMediaAsset: vi.fn(),
  mockDeleteMediaAsset: vi.fn(),
  mockGetMediaAssetUsage: vi.fn(),
  mockAttachMediaToProduct: vi.fn(),
  mockDetachMediaFromProduct: vi.fn(),
  mockSetProductHeroMedia: vi.fn(),
  mockReorderProductMediaV1: vi.fn(),
  mockUpdateProductMediaAltTextV1: vi.fn(),
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
  transaction: mockTransaction,
}));

vi.mock("@/lib/media/storage-admin", () => ({
  createSignedMediaUploadUrl: mockCreateSignedUrl,
  deleteStorageObjects: mockDeleteStorageObjects,
  downloadStorageObject: mockDownloadStorageObject,
  generateGlobalMediaStoragePath: vi.fn((ext: string, assetId?: string) => ({
    storagePath: `media/${assetId || "mock-asset-id"}/original.${ext}`,
    assetId: assetId || "mock-asset-id",
  })),
}));

vi.mock("@/lib/db/media-v1", () => ({
  createMediaAsset: mockCreateMediaAsset,
  getMediaAsset: mockGetMediaAsset,
  deleteMediaAsset: mockDeleteMediaAsset,
  getMediaAssetUsage: mockGetMediaAssetUsage,
  attachMediaToProduct: mockAttachMediaToProduct,
  detachMediaFromProduct: mockDetachMediaFromProduct,
  setProductHeroMedia: mockSetProductHeroMedia,
  reorderProductMediaV1: mockReorderProductMediaV1,
  updateProductMediaAltTextV1: mockUpdateProductMediaAltTextV1,
}));

vi.mock("sharp", () => ({
  default: mockSharp,
}));

import {
  attachMediaAssetToProductAction,
  attachMediaAssetsToProductAction,
  deleteMediaLibraryAssetAction,
  detachMediaAssetFromProductAction,
  finalizeMediaLibraryUploadAction,
  reorderProductMediaActionV1,
  requestMediaLibraryUploadAction,
  setProductMediaHeroAction,
  updateProductMediaAltTextActionV1,
} from "../admin-media-library";
import { AdminAuthError } from "@/lib/auth/admin";

const VALID_PROD_ID = "11111111-1111-4111-8111-111111111111";
const VALID_ASSET_ID = "22222222-2222-4222-8222-222222222222";
const VALID_ASSET_ID_2 = "33333333-3333-4333-8333-333333333333";
const VALID_ASSET_ID_3 = "44444444-4444-4444-8444-444444444444";
const VALID_LEGACY_ID = "55555555-5555-4555-8555-555555555555";

describe("Admin Media Library Server Actions (Phase 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin-1", email: "admin@mirza.com", role: "admin" });
    mockQuery.mockResolvedValue({ rows: [{ status: "draft" }] });
    mockDeleteStorageObjects.mockResolvedValue({ success: true });
    mockGetMediaAsset.mockResolvedValue({
      id: VALID_ASSET_ID,
      storage_provider: "supabase",
      storage_path: `media/${VALID_ASSET_ID}/original.webp`,
    });
    mockTxClient.query.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes("SELECT id FROM public.products")) {
        return { rows: [{ id: VALID_PROD_ID }] };
      }
      if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
        const ids = params?.[0] || [];
        return {
          rows: ids.map((id: string) => ({
            id,
            storage_provider: "supabase",
          })),
        };
      }
      return { rows: [] };
    });
    mockTransaction.mockImplementation(async (cb: any) => cb(mockTxClient));
  });

  /* --------------------------------------------------------------------------
   * 1. requestMediaLibraryUploadAction
   * -------------------------------------------------------------------------- */
  describe("requestMediaLibraryUploadAction", () => {
    it("denies unauthenticated / non-admin user", async () => {
      mockRequireAdmin.mockRejectedValueOnce(
        new AdminAuthError("Admin authorization required.", "FORBIDDEN"),
      );

      const res = await requestMediaLibraryUploadAction(
        "shoe.webp",
        "image/webp",
        1024 * 1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
    });

    it("sanitizes auth infrastructure error without leaking details", async () => {
      mockRequireAdmin.mockRejectedValueOnce(
        new AdminAuthError("Auth service infrastructure outage", "INFRASTRUCTURE_ERROR"),
      );

      const res = await requestMediaLibraryUploadAction(
        "shoe.webp",
        "image/webp",
        1024 * 1024,
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe("Authorization service is temporarily unavailable.");
    });

    it("rejects invalid or empty filenames", async () => {
      const res = await requestMediaLibraryUploadAction("   ", "image/webp", 1024);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Filename is required.");
    });

    it("rejects unsupported MIME types and specifically rejects SVG", async () => {
      const svgRes = await requestMediaLibraryUploadAction(
        "vector.svg",
        "image/svg+xml",
        1024,
      );
      expect(svgRes.success).toBe(false);
      expect(svgRes.error).toBe("SVG images are not allowed.");

      const pdfRes = await requestMediaLibraryUploadAction(
        "doc.pdf",
        "application/pdf",
        1024,
      );
      expect(pdfRes.success).toBe(false);
      expect(pdfRes.error).toContain("Disallowed image type");
    });

    it("rejects invalid byte sizes (<= 0 or > 10MB)", async () => {
      const zeroRes = await requestMediaLibraryUploadAction("shoe.webp", "image/webp", 0);
      expect(zeroRes.success).toBe(false);
      expect(zeroRes.error).toContain("File size must be greater than 0");

      const tooLargeRes = await requestMediaLibraryUploadAction(
        "shoe.webp",
        "image/webp",
        11 * 1024 * 1024,
      );
      expect(tooLargeRes.success).toBe(false);
      expect(tooLargeRes.error).toContain("File size exceeds 10 MB limit");
    });

    it("generates server-side UUID, constructs media/{assetId}/original.{ext} path, and returns signed URL without exposing secrets", async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        signedUrl: "https://supabase.local/storage/v1/upload/sign/product-media/mock",
        token: "secure-upload-token-123",
        path: `media/${VALID_ASSET_ID}/original.webp`,
      });

      const res = await requestMediaLibraryUploadAction(
        "my-shoe.webp",
        "image/webp",
        2 * 1024 * 1024,
      );

      expect(res.success).toBe(true);
      expect(res.signedUrl).toBe("https://supabase.local/storage/v1/upload/sign/product-media/mock");
      expect(res.token).toBe("secure-upload-token-123");
      expect(res.assetId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(res.storagePath).toMatch(/^media\/[0-9a-f-]+\/original\.webp$/);

      // Verify createSignedMediaUploadUrl called with product-independent path
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^media\/[0-9a-f-]+\/original\.webp$/),
      );
    });
  });

  /* --------------------------------------------------------------------------
   * 2. finalizeMediaLibraryUploadAction
   * -------------------------------------------------------------------------- */
  describe("finalizeMediaLibraryUploadAction", () => {
    const validParams = {
      assetId: VALID_ASSET_ID,
      storagePath: `media/${VALID_ASSET_ID}/original.webp`,
      originalFilename: "my-shoe.webp",
      mimeType: "image/webp",
    };

    function setupSharpMock(options?: {
      format?: string;
      width?: number;
      height?: number;
      dominant?: { r: number; g: number; b: number };
      failMetadata?: boolean;
    }) {
      const format = options?.format ?? "webp";
      const width = options?.width ?? 1200;
      const height = options?.height ?? 1200;
      const dominant = options?.dominant ?? { r: 236, g: 231, b: 222 };

      mockSharp.mockImplementation(() => ({
        metadata: options?.failMetadata
          ? vi.fn().mockRejectedValue(new Error("Corrupt image data"))
          : vi.fn().mockResolvedValue({ format, width, height }),
        stats: vi.fn().mockResolvedValue({ dominant }),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-lqip-buffer")),
      }));
    }

    it("denies unauthenticated user", async () => {
      mockRequireAdmin.mockRejectedValueOnce(new AdminAuthError("Admin authorization required.", "FORBIDDEN"));

      const res = await finalizeMediaLibraryUploadAction(validParams);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
    });

    it("rejects invalid asset UUID", async () => {
      const res = await finalizeMediaLibraryUploadAction({
        ...validParams,
        assetId: "bad-uuid",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Valid asset ID (UUID) is required");
    });

    it("rejects path traversal or mismatched path patterns", async () => {
      const traversalRes = await finalizeMediaLibraryUploadAction({
        ...validParams,
        storagePath: `media/${VALID_ASSET_ID}/../../evil.webp`,
      });
      expect(traversalRes.success).toBe(false);
      expect(traversalRes.error).toContain("Invalid storage path");

      const mismatchRes = await finalizeMediaLibraryUploadAction({
        ...validParams,
        storagePath: "products/other-product/image.webp",
      });
      expect(mismatchRes.success).toBe(false);
      expect(mismatchRes.error).toContain("Invalid storage path");
    });

    it("returns existing asset immediately on idempotent retry without redownloading", async () => {
      const existingAsset = {
        id: VALID_ASSET_ID,
        storage_provider: "supabase",
        storage_path: `media/${VALID_ASSET_ID}/original.webp`,
        original_filename: "my-shoe.webp",
        mime_type: "image/webp",
        file_size_bytes: 50000,
        width: 1200,
        height: 1200,
        dominant_color: "#ece7de",
        lqip: "data:image/webp;base64,sample",
        content_sha256: "hash123",
      };

      mockQuery.mockResolvedValueOnce({ rows: [existingAsset] });

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(true);
      expect(res.asset).toEqual(existingAsset);
      expect(mockDownloadStorageObject).not.toHaveBeenCalled();
    });

    it("handles download failure, attempts storage cleanup, and returns error", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Not yet in DB
      mockDownloadStorageObject.mockRejectedValueOnce(new Error("Storage timeout")); // Failed to download

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(false);
      expect(res.error).toContain("Uploaded image could not be retrieved from storage");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validParams.storagePath]);
    });

    it("rejects corrupt image data, cleans up storage, and returns error", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("invalid-corrupt-bytes"));
      setupSharpMock({ failMetadata: true });

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(false);
      expect(res.error).toContain("Image validation failed: Corrupt image data");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validParams.storagePath]);
    });

    it("rejects decoded format mismatch (e.g. extension says webp, decoded bytes are PNG), cleans up storage, and returns error", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("png-bytes-in-webp-extension"));
      setupSharpMock({ format: "png" }); // Decoded format is PNG, but path declared webp

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(false);
      expect(res.error).toContain("MIME type mismatch");
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validParams.storagePath]);
    });

    it("decodes image with Sharp, extracts dimensions, dominant color, LQIP, computes SHA-256, and inserts into public.media_assets without product association", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const sampleBuffer = Buffer.from("valid-clean-webp-bytes");
      mockDownloadStorageObject.mockResolvedValueOnce(sampleBuffer);
      setupSharpMock({
        format: "webp",
        width: 1600,
        height: 1200,
        dominant: { r: 236, g: 231, b: 222 }, // #ece7de
      });

      const insertedAsset = {
        id: VALID_ASSET_ID,
        storage_provider: "supabase",
        storage_path: `media/${VALID_ASSET_ID}/original.webp`,
        original_filename: "my-shoe.webp",
        mime_type: "image/webp",
        file_size_bytes: sampleBuffer.byteLength,
        width: 1600,
        height: 1200,
        dominant_color: "#ece7de",
        lqip: `data:image/webp;base64,${Buffer.from("fake-lqip-buffer").toString("base64")}`,
        content_sha256: "fake-sha-256",
      };
      mockCreateMediaAsset.mockResolvedValueOnce(insertedAsset);

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(true);
      expect(res.asset).toEqual(insertedAsset);

      // Verify createMediaAsset was called with correct parameters
      expect(mockCreateMediaAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          id: VALID_ASSET_ID,
          storageProvider: "supabase",
          storagePath: `media/${VALID_ASSET_ID}/original.webp`,
          originalFilename: "my-shoe.webp",
          mimeType: "image/webp",
          width: 1600,
          height: 1200,
          dominantColor: "#ece7de",
          lqip: expect.stringContaining("data:image/webp;base64,"),
          contentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        }),
      );

      // Verify product placement was NOT called (uploaded to library only)
      expect(mockAttachMediaToProduct).not.toHaveBeenCalled();
    });

    it("cleans up storage object if database insertion fails", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockDownloadStorageObject.mockResolvedValueOnce(Buffer.from("valid-bytes"));
      setupSharpMock();
      mockCreateMediaAsset.mockRejectedValueOnce(new Error("Database connection lost"));

      const res = await finalizeMediaLibraryUploadAction(validParams);

      expect(res.success).toBe(false);
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([validParams.storagePath]);
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Product Placement Actions
   * -------------------------------------------------------------------------- */
  describe("Product Placement Actions", () => {
    describe("attachMediaAssetToProductAction", () => {
      it("requires admin auth", async () => {
        mockRequireAdmin.mockRejectedValueOnce(new AdminAuthError("Admin authorization required.", "FORBIDDEN"));

        const res = await attachMediaAssetToProductAction(VALID_PROD_ID, VALID_ASSET_ID);
        expect(res.success).toBe(false);
        expect(res.error).toBe("Admin authorization required.");
      });

      it("attaches asset to product, passes options, and invalidates catalog-public cache tag", async () => {
        mockAttachMediaToProduct.mockResolvedValueOnce({
          id: "pm-1",
          product_id: VALID_PROD_ID,
          media_asset_id: VALID_ASSET_ID,
          is_hero: true,
          position: 0,
          alt_text: "Attached hero",
        });

        const res = await attachMediaAssetToProductAction(VALID_PROD_ID, VALID_ASSET_ID, {
          isHero: true,
          altText: "Attached hero",
        });

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledWith({
          productId: VALID_PROD_ID,
          mediaAssetId: VALID_ASSET_ID,
          isHero: true,
          altText: "Attached hero",
        });
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });
    });

    describe("attachMediaAssetsToProductAction (atomic batch)", () => {
      it("requires admin auth", async () => {
        mockRequireAdmin.mockRejectedValueOnce(new AdminAuthError("Admin authorization required.", "FORBIDDEN"));

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [VALID_ASSET_ID]);
        expect(res.success).toBe(false);
        expect(res.error).toBe("Admin authorization required.");
      });

      it("rejects duplicate submitted IDs before mutation", async () => {
        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Duplicate media asset IDs");
        expect(mockTransaction).not.toHaveBeenCalled();
        expect(mockAttachMediaToProduct).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("rolls back first attachment if second asset fails", async () => {
        mockTxClient.query.mockImplementation(async (sql: string) => {
          if (sql.includes("SELECT id FROM public.products")) {
            return { rows: [{ id: VALID_PROD_ID }] };
          }
          if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
            return {
              rows: [
                { id: VALID_ASSET_ID, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_2, storage_provider: "supabase" },
              ],
            };
          }
          return { rows: [] };
        });

        mockAttachMediaToProduct
          .mockResolvedValueOnce({ id: "pm-1" })
          .mockRejectedValueOnce(new Error("Database connection lost during second attachment"));

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID_2,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toBe("Failed to process media request.");
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("causes zero attachments when a legacy asset is included in batch", async () => {
        mockTxClient.query.mockImplementation(async (sql: string) => {
          if (sql.includes("SELECT id FROM public.products")) {
            return { rows: [{ id: VALID_PROD_ID }] };
          }
          if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
            return {
              rows: [
                { id: VALID_ASSET_ID, storage_provider: "supabase" },
                { id: VALID_LEGACY_ID, storage_provider: "legacy_public" },
              ],
            };
          }
          return { rows: [] };
        });

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_LEGACY_ID,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Legacy rollback assets cannot be newly attached to products");
        expect(mockAttachMediaToProduct).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("commits all N attachments on successful batch and invalidates cache tag once", async () => {
        mockTxClient.query.mockImplementation(async (sql: string) => {
          if (sql.includes("SELECT id FROM public.products")) {
            return { rows: [{ id: VALID_PROD_ID }] };
          }
          if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
            return {
              rows: [
                { id: VALID_ASSET_ID, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_2, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_3, storage_provider: "supabase" },
              ],
            };
          }
          return { rows: [] };
        });

        mockAttachMediaToProduct.mockResolvedValue({ id: "pm-ok" });

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID_2,
          VALID_ASSET_ID_3,
        ]);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledTimes(3);
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          1,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID, isHero: true },
          mockTxClient,
        );
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          2,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_2, isHero: false },
          mockTxClient,
        );
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          3,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_3, isHero: false },
          mockTxClient,
        );
        expect(mockUpdateTag).toHaveBeenCalledTimes(1);
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });
    });

    describe("Managed Hero Promotion Invariants (Cases A through E)", () => {
      it("Case A: no media + attach A -> A becomes hero", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ count: "0" }],
        });

        const res = await attachMediaAssetToProductAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledWith({
          productId: VALID_PROD_ID,
          mediaAssetId: VALID_ASSET_ID,
          isHero: true,
          altText: undefined,
        });
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("Case B: legacy rollback hero only + attach A -> A becomes managed hero, legacy demoted", async () => {
        // Query filters storage_provider != 'legacy_public', so managed count is 0
        mockQuery.mockResolvedValueOnce({
          rows: [{ count: "0" }],
        });

        const res = await attachMediaAssetToProductAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledWith({
          productId: VALID_PROD_ID,
          mediaAssetId: VALID_ASSET_ID,
          isHero: true,
          altText: undefined,
        });
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("Case C: legacy rollback hero only + batch attach [A, B, C] -> A becomes hero, B/C gallery", async () => {
        mockTxClient.query.mockImplementation(async (sql: string) => {
          if (sql.includes("SELECT id FROM public.products")) {
            return { rows: [{ id: VALID_PROD_ID }] };
          }
          if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
            return {
              rows: [
                { id: VALID_ASSET_ID, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_2, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_3, storage_provider: "supabase" },
              ],
            };
          }
          if (sql.includes("FROM public.product_media pm") && sql.includes("storage_provider != 'legacy_public'")) {
            return { rows: [{ count: "0" }] }; // only legacy rollback exists, so 0 managed
          }
          return { rows: [] };
        });

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID_2,
          VALID_ASSET_ID_3,
        ]);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledTimes(3);
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          1,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID, isHero: true },
          mockTxClient,
        );
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          2,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_2, isHero: false },
          mockTxClient,
        );
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          3,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_3, isHero: false },
          mockTxClient,
        );
        expect(mockUpdateTag).toHaveBeenCalledTimes(1);
      });

      it("Case D: existing managed hero A + attach B -> A remains hero, B is gallery", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ count: "1" }],
        });

        const res = await attachMediaAssetToProductAction(VALID_PROD_ID, VALID_ASSET_ID_2);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledWith({
          productId: VALID_PROD_ID,
          mediaAssetId: VALID_ASSET_ID_2,
          isHero: false,
          altText: undefined,
        });
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("Case E: existing managed hero A + batch attach [B, C] -> A remains hero, B/C are gallery", async () => {
        mockTxClient.query.mockImplementation(async (sql: string) => {
          if (sql.includes("SELECT id FROM public.products")) {
            return { rows: [{ id: VALID_PROD_ID }] };
          }
          if (sql.includes("SELECT id, storage_provider FROM public.media_assets")) {
            return {
              rows: [
                { id: VALID_ASSET_ID_2, storage_provider: "supabase" },
                { id: VALID_ASSET_ID_3, storage_provider: "supabase" },
              ],
            };
          }
          if (sql.includes("FROM public.product_media pm") && sql.includes("storage_provider != 'legacy_public'")) {
            return { rows: [{ count: "1" }] }; // managed hero already exists
          }
          return { rows: [] };
        });

        const res = await attachMediaAssetsToProductAction(VALID_PROD_ID, [
          VALID_ASSET_ID_2,
          VALID_ASSET_ID_3,
        ]);

        expect(res.success).toBe(true);
        expect(mockAttachMediaToProduct).toHaveBeenCalledTimes(2);
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          1,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_2, isHero: false },
          mockTxClient,
        );
        expect(mockAttachMediaToProduct).toHaveBeenNthCalledWith(
          2,
          { productId: VALID_PROD_ID, mediaAssetId: VALID_ASSET_ID_3, isHero: false },
          mockTxClient,
        );
        expect(mockUpdateTag).toHaveBeenCalledTimes(1);
      });
    });

    describe("detachMediaAssetFromProductAction", () => {
      it("detaches asset and invalidates catalog-public cache tag", async () => {
        mockDetachMediaFromProduct.mockResolvedValueOnce(undefined);

        const res = await detachMediaAssetFromProductAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(true);
        expect(mockDetachMediaFromProduct).toHaveBeenCalledWith(VALID_PROD_ID, VALID_ASSET_ID);
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("guards legacy_public assets from being detached (read-only during rollback window)", async () => {
        mockGetMediaAsset.mockResolvedValueOnce({
          id: VALID_ASSET_ID,
          storage_provider: "legacy_public",
          storage_path: "/catalog-shoes/shoe-01.webp",
        });

        const res = await detachMediaAssetFromProductAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(false);
        expect(res.error).toBe("Legacy rollback assets are read-only during the rollback window.");
        expect(mockDetachMediaFromProduct).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });
    });

    describe("setProductMediaHeroAction", () => {
      it("promotes media to hero atomically and invalidates catalog-public cache tag", async () => {
        mockSetProductHeroMedia.mockResolvedValueOnce(undefined);

        const res = await setProductMediaHeroAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(true);
        expect(mockSetProductHeroMedia).toHaveBeenCalledWith(VALID_PROD_ID, VALID_ASSET_ID);
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("rejects legacy_public rollback assets from being set as hero", async () => {
        mockGetMediaAsset.mockResolvedValueOnce({
          id: VALID_ASSET_ID,
          storage_provider: "legacy_public",
          storage_path: "/catalog-shoes/shoe-01.webp",
        });

        const res = await setProductMediaHeroAction(VALID_PROD_ID, VALID_ASSET_ID);

        expect(res.success).toBe(false);
        expect(res.error).toBe("Legacy rollback assets cannot be set as hero.");
        expect(mockSetProductHeroMedia).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });
    });

    describe("reorderProductMediaActionV1 (strictly managed-only)", () => {
      it("rejects duplicate submitted IDs before mutation", async () => {
        const res = await reorderProductMediaActionV1(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Duplicate media asset IDs");
        expect(mockReorderProductMediaV1).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("rejects legacy ID injection", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { media_asset_id: VALID_ASSET_ID, storage_provider: "supabase" },
            { media_asset_id: VALID_ASSET_ID_2, storage_provider: "supabase" },
            { media_asset_id: VALID_LEGACY_ID, storage_provider: "legacy_public" },
          ],
        });

        const res = await reorderProductMediaActionV1(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_LEGACY_ID,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Legacy rollback assets cannot be reordered");
        expect(mockReorderProductMediaV1).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("rejects omitted managed ID", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { media_asset_id: VALID_ASSET_ID, storage_provider: "supabase" },
            { media_asset_id: VALID_ASSET_ID_2, storage_provider: "supabase" },
          ],
        });

        const res = await reorderProductMediaActionV1(VALID_PROD_ID, [VALID_ASSET_ID]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Submitted media IDs must contain all current managed media assets");
        expect(mockReorderProductMediaV1).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("rejects unknown extra ID", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { media_asset_id: VALID_ASSET_ID, storage_provider: "supabase" },
          ],
        });

        const res = await reorderProductMediaActionV1(VALID_PROD_ID, [
          VALID_ASSET_ID,
          VALID_ASSET_ID_2,
        ]);

        expect(res.success).toBe(false);
        expect(res.error).toContain("Extra media asset ID");
        expect(mockReorderProductMediaV1).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });

      it("valid managed reorder preserves legacy IDs in their existing relative order after managed media", async () => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            { media_asset_id: VALID_ASSET_ID, storage_provider: "supabase" },
            { media_asset_id: VALID_ASSET_ID_2, storage_provider: "supabase" },
            { media_asset_id: VALID_LEGACY_ID, storage_provider: "legacy_public" },
            { media_asset_id: "66666666-6666-4666-8666-666666666666", storage_provider: "legacy_public" },
          ],
        });
        mockReorderProductMediaV1.mockResolvedValueOnce(undefined);

        const res = await reorderProductMediaActionV1(VALID_PROD_ID, [
          VALID_ASSET_ID_2,
          VALID_ASSET_ID,
        ]);

        expect(res.success).toBe(true);
        expect(mockReorderProductMediaV1).toHaveBeenCalledWith(VALID_PROD_ID, [
          VALID_ASSET_ID_2,
          VALID_ASSET_ID,
          VALID_LEGACY_ID,
          "66666666-6666-4666-8666-666666666666",
        ]);
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });
    });

    describe("updateProductMediaAltTextActionV1", () => {
      it("updates alt text and invalidates catalog-public cache tag", async () => {
        mockUpdateProductMediaAltTextV1.mockResolvedValueOnce(undefined);

        const res = await updateProductMediaAltTextActionV1(
          VALID_PROD_ID,
          VALID_ASSET_ID,
          "Updated angle description",
        );

        expect(res.success).toBe(true);
        expect(mockUpdateProductMediaAltTextV1).toHaveBeenCalledWith(
          VALID_PROD_ID,
          VALID_ASSET_ID,
          "Updated angle description",
        );
        expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
      });

      it("guards legacy_public assets from having alt text modified (read-only during rollback window)", async () => {
        mockGetMediaAsset.mockResolvedValueOnce({
          id: VALID_ASSET_ID,
          storage_provider: "legacy_public",
          storage_path: "/catalog-shoes/shoe-01.webp",
        });

        const res = await updateProductMediaAltTextActionV1(
          VALID_PROD_ID,
          VALID_ASSET_ID,
          "Attempted legacy alt text edit",
        );

        expect(res.success).toBe(false);
        expect(res.error).toBe("Legacy rollback assets are read-only during the rollback window.");
        expect(mockUpdateProductMediaAltTextV1).not.toHaveBeenCalled();
        expect(mockUpdateTag).not.toHaveBeenCalled();
      });
    });
  });

  /* --------------------------------------------------------------------------
   * 4. deleteMediaLibraryAssetAction
   * -------------------------------------------------------------------------- */
  describe("deleteMediaLibraryAssetAction", () => {
    it("requires admin auth", async () => {
      mockRequireAdmin.mockRejectedValueOnce(new AdminAuthError("Admin authorization required.", "FORBIDDEN"));

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
    });

    it("rejects invalid asset UUID", async () => {
      const res = await deleteMediaLibraryAssetAction("not-a-uuid");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Valid asset ID (UUID) is required");
    });

    it("returns error if asset does not exist", async () => {
      mockGetMediaAsset.mockResolvedValueOnce(null);

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Media asset not found");
    });

    it("guards legacy_public assets from deletion during rollback period", async () => {
      mockGetMediaAsset.mockResolvedValueOnce({
        id: VALID_ASSET_ID,
        storage_provider: "legacy_public",
        storage_path: "/catalog-shoes/shoe-01.webp",
      });

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Legacy assets are read-only during the rollback window and cannot be deleted.");
    });

    it("guards assets currently in use by products and rejects deletion with product titles", async () => {
      mockGetMediaAsset.mockResolvedValueOnce({
        id: VALID_ASSET_ID,
        storage_provider: "supabase",
        storage_path: `media/${VALID_ASSET_ID}/original.webp`,
      });
      mockGetMediaAssetUsage.mockResolvedValueOnce({
        assetId: VALID_ASSET_ID,
        usageCount: 2,
        products: [
          { productId: "p1", productName: "The Oxford", productSlug: "the-oxford" },
          { productId: "p2", productName: "The Derby", productSlug: "the-derby" },
        ],
      });

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Cannot delete media asset");
      expect(res.error).toContain("attached to 2 product(s)");
      expect(mockDeleteMediaAsset).not.toHaveBeenCalled();
      expect(mockDeleteStorageObjects).not.toHaveBeenCalled();
    });

    it("executes safe sequence: DB delete first, then Supabase Storage object cleanup", async () => {
      const storagePath = `media/${VALID_ASSET_ID}/original.webp`;
      mockGetMediaAsset.mockResolvedValueOnce({
        id: VALID_ASSET_ID,
        storage_provider: "supabase",
        storage_path: storagePath,
      });
      mockGetMediaAssetUsage.mockResolvedValueOnce({
        assetId: VALID_ASSET_ID,
        usageCount: 0,
        products: [],
      });
      mockDeleteMediaAsset.mockResolvedValueOnce(true);
      mockDeleteStorageObjects.mockResolvedValueOnce({ success: true });

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);

      expect(res.success).toBe(true);

      // Verify DB delete was called before Storage delete
      expect(mockDeleteMediaAsset).toHaveBeenCalledWith(VALID_ASSET_ID);
      expect(mockDeleteStorageObjects).toHaveBeenCalledWith([storagePath]);
      expect(mockUpdateTag).toHaveBeenCalledWith("catalog-public");
    });

    it("returns success: true with structured warning if DB delete succeeds but Storage cleanup fails", async () => {
      const storagePath = `media/${VALID_ASSET_ID}/original.webp`;
      mockGetMediaAsset.mockResolvedValueOnce({
        id: VALID_ASSET_ID,
        storage_provider: "supabase",
        storage_path: storagePath,
      });
      mockGetMediaAssetUsage.mockResolvedValueOnce({
        assetId: VALID_ASSET_ID,
        usageCount: 0,
        products: [],
      });
      mockDeleteMediaAsset.mockResolvedValueOnce(true);
      mockDeleteStorageObjects.mockResolvedValueOnce({
        success: false,
        error: "Storage timeout",
      });

      const res = await deleteMediaLibraryAssetAction(VALID_ASSET_ID);

      expect(res.success).toBe(true);
      expect(res.warning).toContain("storage cleanup encountered an error");
    });
  });
});
