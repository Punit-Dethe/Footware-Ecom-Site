import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  listMediaLibraryAssets: vi.fn(),
  getMediaLibraryAsset: vi.fn(),
  getMediaAsset: vi.fn(),
  getMediaAssetUsage: vi.fn(),
  deleteMediaLibraryAssetAction: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => {
  class MockAdminAuthError extends Error {
    constructor(message: string, public readonly code: string = "FORBIDDEN") {
      super(message);
      this.name = "AdminAuthError";
    }
  }
  return {
    requireAdmin: mockAuth.requireAdmin,
    AdminAuthError: MockAdminAuthError,
  };
});

vi.mock("@/lib/db/media-v1", () => ({
  listMediaLibraryAssets: mockDb.listMediaLibraryAssets,
  getMediaLibraryAsset: mockDb.getMediaLibraryAsset,
  getMediaAsset: mockDb.getMediaAsset,
  getMediaAssetUsage: mockDb.getMediaAssetUsage,
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/admin/media/MediaLibraryClient", () => ({
  MediaLibraryClient: (props: any) => props,
}));

import { AdminMediaPageContent } from "../page";
import { getMediaLibraryAssetDetailAction } from "@/lib/actions/admin-media-library";

const TEST_PARAMS = Promise.resolve({ country: "us", locale: "en" });
const TEST_ASSET_ID = "33333333-3333-4333-8333-333333333333";

describe("Media Library Admin UI (Phase 6A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.requireAdmin.mockResolvedValue({
      userId: "admin-1",
      email: "admin@mirzafootwear.com",
      profile: { id: "admin-1", role: "admin" },
    });
    mockDb.listMediaLibraryAssets.mockResolvedValue({
      items: [],
      totalCount: 0,
      limit: 24,
      offset: 0,
    });
  });

  describe("1. Route Authorization & Default Filter Invariants", () => {
    it("rejects unauthenticated requests before calling DAL", async () => {
      mockAuth.requireAdmin.mockRejectedValueOnce(
        new Error("Admin authorization required."),
      );

      await expect(
        AdminMediaPageContent({
          params: TEST_PARAMS,
          searchParams: Promise.resolve({}),
        }),
      ).rejects.toThrow("Admin authorization required.");

      expect(mockDb.listMediaLibraryAssets).not.toHaveBeenCalled();
    });

    it("defaults provider to 'supabase' to prioritize managed assets over legacy rollback copies", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({}),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith({
        query: undefined,
        provider: "supabase",
        sort: "created_desc",
        limit: 24,
        offset: 0,
      });
    });

    it("maps provider='all' to undefined so all media providers are queried", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ provider: "all" }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: undefined,
        }),
      );
    });

    it("passes provider='legacy_public' when admin explicitly filters for rollback assets", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ provider: "legacy_public" }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "legacy_public",
        }),
      );
    });
  });

  describe("2. Search, Sort, and Pagination Parameter Mapping", () => {
    it("parses search query 'q' and trims whitespace", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ q: "  oxford leather  " }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "oxford leather",
        }),
      );
    });

    it("parses sort parameter and maps to DAL", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ sort: "size_desc" }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: "size_desc",
        }),
      );
    });

    it("parses page numbers and computes bounded 24-item offset", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ page: "3" }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 24,
          offset: 48, // (3 - 1) * 24
        }),
      );
    });

    it("handles invalid or negative page numbers safely by falling back to page 1", async () => {
      await AdminMediaPageContent({
        params: TEST_PARAMS,
        searchParams: Promise.resolve({ page: "-5" }),
      });

      expect(mockDb.listMediaLibraryAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 24,
          offset: 0,
        }),
      );
    });
  });

  describe("3. getMediaLibraryAssetDetailAction", () => {
    it("rejects non-admin caller", async () => {
      mockAuth.requireAdmin.mockRejectedValueOnce(
        new Error("Admin authorization required."),
      );

      const res = await getMediaLibraryAssetDetailAction(TEST_ASSET_ID);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Admin authorization required.");
    });

    it("rejects invalid UUID format", async () => {
      const res = await getMediaLibraryAssetDetailAction("not-a-uuid");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Valid asset ID (UUID) is required");
    });

    it("returns full asset detail with resolved publicUrl and product placement report", async () => {
      const mockDetail = {
        id: TEST_ASSET_ID,
        storage_provider: "supabase",
        storage_path: `media/${TEST_ASSET_ID}/original.webp`,
        original_filename: "the-oxford.webp",
        mime_type: "image/webp",
        file_size_bytes: 45000,
        width: 1200,
        height: 1200,
        dominant_color: "#ece7de",
        lqip: "data:image/webp;base64,sample",
        content_sha256: "hash123",
        created_at: new Date(),
        updated_at: new Date(),
        publicUrl: `https://supabase.local/storage/v1/object/public/product-media/media/${TEST_ASSET_ID}/original.webp`,
        usage: {
          assetId: TEST_ASSET_ID,
          usageCount: 1,
          products: [
            {
              productId: "11111111-1111-4111-8111-111111111111",
              productName: "The Sovereign Oxford",
              productSlug: "shoe-2026-09-001",
              position: 0,
              isHero: true,
              altText: "Hero",
            },
          ],
        },
      };

      mockDb.getMediaLibraryAsset.mockResolvedValueOnce(mockDetail);

      const res = await getMediaLibraryAssetDetailAction(TEST_ASSET_ID);
      expect(res.success).toBe(true);
      expect(res.asset).toEqual(mockDetail);
      expect(res.asset?.usage.usageCount).toBe(1);
      expect(res.asset?.usage.products[0].productName).toBe("The Sovereign Oxford");
    });
  });
});
