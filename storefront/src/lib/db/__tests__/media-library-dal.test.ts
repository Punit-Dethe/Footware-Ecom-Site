import fs from "node:fs";
import path from "node:path";
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
  getMediaLibraryAsset,
  listMediaLibraryAssets,
  updateProductMediaAltTextV1,
} from "../media-v1";

const TEST_PRODUCT_1 = "11111111-1111-4111-8111-111111111111";
const TEST_ASSET_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("Media Library DAL (Phase 5)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("1. Migration SQL Schema Invariants (20260918150000_media_library_content_hash.sql)", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260918150000_media_library_content_hash.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    it("verifies the Phase 5 migration file exists", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it("adds content_sha256 column and partial index", () => {
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS content_sha256 VARCHAR(64)");
      expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_media_assets_content_sha256");
      expect(sql).toContain("ON public.media_assets (content_sha256)");
      expect(sql).toContain("WHERE content_sha256 IS NOT NULL");
    });
  });

  describe("2. listMediaLibraryAssets", () => {
    it("fetches paginated assets with total count and usage count in a single query (0 N+1)", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ASSET_1,
            storage_provider: "supabase",
            storage_path: `media/${TEST_ASSET_1}/original.webp`,
            original_filename: "test-shoe.webp",
            mime_type: "image/webp",
            file_size_bytes: 45000,
            width: 1200,
            height: 1200,
            dominant_color: "#ece7de",
            lqip: "data:image/webp;base64,lqipdata",
            processed_variants: null,
            content_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            created_at: new Date("2026-09-18T10:00:00Z"),
            updated_at: new Date("2026-09-18T10:00:00Z"),
            full_count: 1,
            usage_count: 2,
          },
        ],
      });

      const result = await listMediaLibraryAssets({
        limit: 20,
        offset: 0,
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain("COUNT(*) OVER()::int AS full_count");
      expect(sql).toContain("SELECT COUNT(*)::int");
      expect(sql).toContain("FROM public.product_media pm");
      expect(params).toContain(20); // limit
      expect(params).toContain(0); // offset

      expect(result.totalCount).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(TEST_ASSET_1);
      expect(result.items[0].usageCount).toBe(2);
      expect(result.items[0].publicUrl).toContain(
        `media/${TEST_ASSET_1}/original.webp`,
      );
    });

    it("applies query search across original_filename and storage_path", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await listMediaLibraryAssets({
        query: "oxford",
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain("ma.original_filename ILIKE");
      expect(sql).toContain("ma.storage_path ILIKE");
      expect(params).toContain("%oxford%");
    });

    it("applies provider filter", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await listMediaLibraryAssets({
        provider: "supabase",
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain("ma.storage_provider =");
      expect(params).toContain("supabase");
    });

    it("sorts by size descending when requested", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await listMediaLibraryAssets({
        sort: "size_desc",
      });

      const [sql] = mockDb.query.mock.calls[0];
      expect(sql).toContain("ORDER BY ma.file_size_bytes DESC NULLS LAST, ma.created_at DESC");
    });

    it("caps limit to 100", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await listMediaLibraryAssets({
        limit: 500,
      });

      expect(result.limit).toBe(100);
      const [, params] = mockDb.query.mock.calls[0];
      expect(params).toContain(100);
    });
  });

  describe("3. getMediaLibraryAsset", () => {
    it("returns null if asset does not exist", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const asset = await getMediaLibraryAsset(TEST_ASSET_1);
      expect(asset).toBeNull();
    });

    it("returns detailed asset with publicUrl and full product usage breakdown", async () => {
      // First call for getMediaAsset
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ASSET_1,
            storage_provider: "supabase",
            storage_path: `media/${TEST_ASSET_1}/original.webp`,
            original_filename: "sample.webp",
            mime_type: "image/webp",
            file_size_bytes: 50000,
            width: 1200,
            height: 1200,
            dominant_color: "#ffffff",
            lqip: "data:image/webp;base64,xyz",
            processed_variants: null,
            content_sha256: "hash123",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });
      // Second call for getMediaAssetUsage
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            product_id: TEST_PRODUCT_1,
            product_title: "The Oxford",
            product_slug: "the-oxford",
            position: 0,
            is_hero: true,
            alt_text: "Front view",
          },
        ],
      });

      const detail = await getMediaLibraryAsset(TEST_ASSET_1);
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(TEST_ASSET_1);
      expect(detail?.publicUrl).toContain(`media/${TEST_ASSET_1}/original.webp`);
      expect(detail?.usage.usageCount).toBe(1);
      expect(detail?.usage.products[0].productId).toBe(TEST_PRODUCT_1);
    });
  });

  describe("4. updateProductMediaAltTextV1", () => {
    it("updates alt text and trims whitespace", async () => {
      mockDb.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [],
      });

      await updateProductMediaAltTextV1(
        TEST_PRODUCT_1,
        TEST_ASSET_1,
        "   Clean Alt Text   ",
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media"),
        ["Clean Alt Text", TEST_PRODUCT_1, TEST_ASSET_1],
      );
    });

    it("sets alt_text to null if empty string provided", async () => {
      mockDb.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [],
      });

      await updateProductMediaAltTextV1(TEST_PRODUCT_1, TEST_ASSET_1, "   ");

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media"),
        [null, TEST_PRODUCT_1, TEST_ASSET_1],
      );
    });

    it("throws MediaDomainError if association does not exist", async () => {
      mockDb.query.mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });

      await expect(
        updateProductMediaAltTextV1(TEST_PRODUCT_1, TEST_ASSET_1, "Text"),
      ).rejects.toThrow("Cannot update alt text");
    });
  });
});
