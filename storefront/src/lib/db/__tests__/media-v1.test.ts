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
  createMediaAsset,
  getMediaAsset,
  listMediaAssets,
  deleteMediaAsset,
  getMediaAssetUsage,
  listProductMediaV1,
  attachMediaToProduct,
  detachMediaFromProduct,
  setProductHeroMedia,
  reorderProductMediaV1,
  MediaDomainError,
  type DbMediaAsset,
} from "../media-v1";

const TEST_PRODUCT_1 = "11111111-1111-4111-8111-111111111111";
const TEST_PRODUCT_2 = "22222222-2222-4222-8222-222222222222";
const TEST_ASSET_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEST_ASSET_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("Media Contract v1 Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /* --------------------------------------------------------------------------
   * 1. Schema & Migration Invariants Verification
   * -------------------------------------------------------------------------- */
  describe("1. Migration SQL Schema Invariants (20260918000000_media_contract_v1.sql)", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260918000000_media_contract_v1.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    it("verifies the migration file exists", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it("defines public.media_assets with physical metadata columns", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.media_assets");
      expect(sql).toContain("storage_provider VARCHAR(50) NOT NULL");
      expect(sql).toContain("storage_path VARCHAR(500) NOT NULL");
      expect(sql).toContain("original_filename VARCHAR(255)");
      expect(sql).toContain("mime_type VARCHAR(100)");
      expect(sql).toContain("file_size_bytes BIGINT");
      expect(sql).toContain("width INT");
      expect(sql).toContain("height INT");
      expect(sql).toContain("dominant_color VARCHAR(30)");
      expect(sql).toContain("lqip TEXT");
      expect(sql).toContain("processed_variants JSONB");
      expect(sql).toContain("created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
      expect(sql).toContain("updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
    });

    it("enforces provider and storage path uniqueness on media_assets", () => {
      expect(sql).toContain(
        "CONSTRAINT uq_media_assets_provider_path UNIQUE (storage_provider, storage_path)",
      );
    });

    it("defines public.product_media with proper foreign keys and delete cascade/restrict rules", () => {
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.product_media");
      // Deleting a product cascades to its associations
      expect(sql).toContain(
        "product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE",
      );
      // Deleting a referenced media asset is strictly RESTRICTED
      expect(sql).toContain(
        "media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT",
      );
      expect(sql).toContain("position INT NOT NULL DEFAULT 0");
      expect(sql).toContain("is_hero BOOLEAN NOT NULL DEFAULT FALSE");
      expect(sql).toContain("alt_text VARCHAR(255)");
    });

    it("enforces duplicate pair rejection and single hero per product at database level", () => {
      // Rejects duplicate product_id + media_asset_id
      expect(sql).toContain(
        "CONSTRAINT uq_product_media_product_asset UNIQUE (product_id, media_asset_id)",
      );
      // Partial unique index enforcing at most one hero image per product
      expect(sql).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_single_hero");
      expect(sql).toContain("ON public.product_media (product_id)");
      expect(sql).toContain("WHERE is_hero = true");
    });

    it("enforces Row Level Security (RLS) and revokes access from untrusted browser roles", () => {
      expect(sql).toContain("ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("REVOKE ALL ON TABLE public.media_assets FROM anon, authenticated;");
      expect(sql).toContain("ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;");
      expect(sql).toContain("REVOKE ALL ON TABLE public.product_media FROM anon, authenticated;");
    });

    it("performs deterministic backfill classifying catalog-shoes as legacy_public and others as supabase", () => {
      expect(sql).toContain("WHEN pi.storage_path LIKE '/catalog-shoes/%' THEN 'legacy_public'");
      expect(sql).toContain("ELSE 'supabase'");
      expect(sql).toContain("ON CONFLICT (storage_provider, storage_path) DO NOTHING;");
      expect(sql).toContain("ON CONFLICT (product_id, media_asset_id) DO NOTHING;");
    });

    it("does NOT alter, drop, or truncate the legacy public.product_images table", () => {
      expect(sql).not.toMatch(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\.product_images/i);
      expect(sql).not.toMatch(/ALTER\s+TABLE\s+public\.product_images\s+DROP/i);
      expect(sql).not.toMatch(/TRUNCATE\s+TABLE\s+public\.product_images/i);
    });
  });

  /* --------------------------------------------------------------------------
   * 2. Physical Media Asset Lifecycle (Independent of Products)
   * -------------------------------------------------------------------------- */
  describe("2. Global Media Asset Lifecycle", () => {
    it("creates a media asset independently of any product", async () => {
      const sampleAsset: DbMediaAsset = {
        id: TEST_ASSET_1,
        storage_provider: "supabase",
        storage_path: "media/asset-1/original.webp",
        original_filename: "sample-shoe.webp",
        mime_type: "image/webp",
        file_size_bytes: 54321,
        width: 1200,
        height: 1200,
        dominant_color: "#e2dcd5",
        lqip: "data:image/webp;base64,sample",
        processed_variants: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({ rows: [sampleAsset] });

      const asset = await createMediaAsset({
        storagePath: "media/asset-1/original.webp",
        originalFilename: "sample-shoe.webp",
        mimeType: "image/webp",
        fileSizeBytes: 54321,
        width: 1200,
        height: 1200,
      });

      expect(asset.id).toBe(TEST_ASSET_1);
      expect(asset.storage_provider).toBe("supabase");
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO public.media_assets"),
        expect.arrayContaining(["media/asset-1/original.webp", "supabase"]),
      );
    });

    it("defaults to supabase storage provider when unspecified", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ASSET_1,
            storage_provider: "supabase",
            storage_path: "media/asset-1/original.webp",
          },
        ],
      });

      await createMediaAsset({
        storagePath: "media/asset-1/original.webp",
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(["supabase", "media/asset-1/original.webp"]),
      );
    });

    it("rejects duplicate storage path for the same provider", async () => {
      const duplicateError: any = new Error("Unique constraint violation");
      duplicateError.code = "23505";
      mockDb.query.mockRejectedValueOnce(duplicateError);

      await expect(
        createMediaAsset({ storagePath: "media/asset-1/original.webp" }),
      ).rejects.toThrow(MediaDomainError);
    });

    it("retrieves a single media asset by ID", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: TEST_ASSET_1, storage_path: "media/1/original.webp" }],
      });

      const asset = await getMediaAsset(TEST_ASSET_1);
      expect(asset?.id).toBe(TEST_ASSET_1);
    });

    it("lists media assets with pagination and filtering", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: TEST_ASSET_1 }, { id: TEST_ASSET_2 }],
      });

      const list = await listMediaAssets({
        storageProvider: "supabase",
        limit: 10,
        offset: 0,
      });

      expect(list).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE storage_provider = $1"),
        ["supabase", 10, 0],
      );
    });

    it("prevents deletion of a referenced media asset (RESTRICT violation)", async () => {
      const fkError: any = new Error("Foreign key constraint violation");
      fkError.code = "23503";
      mockDb.query.mockRejectedValueOnce(fkError);

      await expect(deleteMediaAsset(TEST_ASSET_1)).rejects.toThrow(
        /Cannot delete media asset.*currently referenced/i,
      );
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Product Association & Global Reuse (Many-to-Many Placement)
   * -------------------------------------------------------------------------- */
  describe("3. Product Association & Global Reuse", () => {
    it("allows the same global asset to be attached to multiple products", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // First attach: Product 1 + Asset 1
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_1 }] }) // product check
        .mockResolvedValueOnce({ rows: [{ id: TEST_ASSET_1 }] }) // asset check
        .mockResolvedValueOnce({ rows: [{ max_pos: null, count: 0, hero_count: 0 }] }) // stats
        .mockResolvedValueOnce({}) // hero clear
        .mockResolvedValueOnce({
          rows: [
            {
              id: "pm-1",
              product_id: TEST_PRODUCT_1,
              media_asset_id: TEST_ASSET_1,
              position: 0,
              is_hero: true,
            },
          ],
        });

      const p1Attachment = await attachMediaToProduct({
        productId: TEST_PRODUCT_1,
        mediaAssetId: TEST_ASSET_1,
      });

      expect(p1Attachment.product_id).toBe(TEST_PRODUCT_1);
      expect(p1Attachment.media_asset_id).toBe(TEST_ASSET_1);

      // Second attach: Product 2 + Same Asset 1 (Global Reuse!)
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_2 }] }) // product check
        .mockResolvedValueOnce({ rows: [{ id: TEST_ASSET_1 }] }) // asset check
        .mockResolvedValueOnce({ rows: [{ max_pos: 2, count: 2, hero_count: 1 }] }) // stats
        .mockResolvedValueOnce({
          rows: [
            {
              id: "pm-2",
              product_id: TEST_PRODUCT_2,
              media_asset_id: TEST_ASSET_1,
              position: 3,
              is_hero: false,
            },
          ],
        });

      const p2Attachment = await attachMediaToProduct({
        productId: TEST_PRODUCT_2,
        mediaAssetId: TEST_ASSET_1,
      });

      expect(p2Attachment.product_id).toBe(TEST_PRODUCT_2);
      expect(p2Attachment.media_asset_id).toBe(TEST_ASSET_1);
    });

    it("rejects duplicate product-media attachment pair", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      const uniqueError: any = new Error("Unique constraint violation");
      uniqueError.code = "23505";

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_1 }] })
        .mockResolvedValueOnce({ rows: [{ id: TEST_ASSET_1 }] })
        .mockResolvedValueOnce({ rows: [{ max_pos: 0, count: 1, hero_count: 1 }] })
        .mockRejectedValueOnce(uniqueError);

      await expect(
        attachMediaToProduct({
          productId: TEST_PRODUCT_1,
          mediaAssetId: TEST_ASSET_1,
        }),
      ).rejects.toThrow(/already attached to product/i);
    });

    it("automatically assigns is_hero = true to first attached image", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_1 }] })
        .mockResolvedValueOnce({ rows: [{ id: TEST_ASSET_1 }] })
        .mockResolvedValueOnce({ rows: [{ max_pos: null, count: 0, hero_count: 0 }] })
        .mockResolvedValueOnce({}) // clear existing
        .mockResolvedValueOnce({
          rows: [{ id: "pm-1", is_hero: true, position: 0 }],
        });

      const res = await attachMediaToProduct({
        productId: TEST_PRODUCT_1,
        mediaAssetId: TEST_ASSET_1,
      });

      expect(res.is_hero).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET is_hero = false"),
        [TEST_PRODUCT_1],
      );
    });

    it("clears legacy rollback hero atomically without deleting the legacy row when attaching first managed hero", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // Product has 1 legacy rollback placement (is_hero = true)
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: TEST_PRODUCT_1 }] }) // verify product exists
        .mockResolvedValueOnce({ rows: [{ id: TEST_ASSET_1 }] }) // verify media asset exists
        .mockResolvedValueOnce({ rows: [{ max_pos: 0, count: 1, hero_count: 1 }] }) // existing stats (legacy)
        .mockResolvedValueOnce({}) // UPDATE public.product_media SET is_hero = false (clears legacy hero)
        .mockResolvedValueOnce({
          rows: [{ id: "pm-managed", is_hero: true, position: 1 }],
        }); // INSERT managed hero

      const res = await attachMediaToProduct({
        productId: TEST_PRODUCT_1,
        mediaAssetId: TEST_ASSET_1,
        isHero: true,
      });

      expect(res.is_hero).toBe(true);
      // Verify previous legacy hero cleared
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET is_hero = false"),
        [TEST_PRODUCT_1],
      );
      // Verify no DELETE query occurred (legacy row remains attached)
      const deleteCalls = mockClient.query.mock.calls.filter((call: any[]) =>
        call[0].includes("DELETE FROM public.product_media"),
      );
      expect(deleteCalls).toHaveLength(0);
    });

    it("atomically changes product hero and clears previous hero", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "pm-target" }] }) // verify exists
        .mockResolvedValueOnce({}) // clear previous hero
        .mockResolvedValueOnce({}); // set new hero

      await setProductHeroMedia(TEST_PRODUCT_1, TEST_ASSET_2);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET is_hero = false"),
        [TEST_PRODUCT_1],
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET is_hero = true"),
        [TEST_PRODUCT_1, TEST_ASSET_2],
      );
    });

    it("detaches media from product and promotes next hero if hero was detached", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "pm-1", is_hero: true }] }) // find current
        .mockResolvedValueOnce({}) // delete association
        .mockResolvedValueOnce({ rows: [{ id: "pm-2" }] }) // find next lowest-pos
        .mockResolvedValueOnce({}); // promote next lowest-pos to hero

      await detachMediaFromProduct(TEST_PRODUCT_1, TEST_ASSET_1);

      // Verify deletion from product_media ONLY (media_assets is NOT deleted!)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM public.product_media"),
        [TEST_PRODUCT_1, TEST_ASSET_1],
      );
      // Verify promotion of next remaining image
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET is_hero = true"),
        ["pm-2"],
      );
    });

    it("reorders product media deterministically with duplicate/length guards", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // Existing assets on product
      mockClient.query.mockResolvedValueOnce({
        rows: [{ media_asset_id: TEST_ASSET_1 }, { media_asset_id: TEST_ASSET_2 }],
      });

      // Submit reorder [ASSET_2, ASSET_1]
      await reorderProductMediaV1(TEST_PRODUCT_1, [TEST_ASSET_2, TEST_ASSET_1]);

      // Position 0 for ASSET_2, Position 1 for ASSET_1
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET position = $1"),
        [0, TEST_PRODUCT_1, TEST_ASSET_2],
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_media SET position = $1"),
        [1, TEST_PRODUCT_1, TEST_ASSET_1],
      );
    });

    it("rejects reorder containing duplicate asset IDs", async () => {
      const mockClient = { query: vi.fn() };
      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query.mockResolvedValueOnce({
        rows: [{ media_asset_id: TEST_ASSET_1 }, { media_asset_id: TEST_ASSET_2 }],
      });

      await expect(
        reorderProductMediaV1(TEST_PRODUCT_1, [TEST_ASSET_1, TEST_ASSET_1]),
      ).rejects.toThrow(/contain duplicates/i);
    });
  });

  /* --------------------------------------------------------------------------
   * 4. Usage Tracking & Bounded Queries (Media Library Foundation)
   * -------------------------------------------------------------------------- */
  describe("4. Usage Tracking & Query Bounds", () => {
    it("reports all products referencing a global asset in a single bounded query (no N+1)", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            product_id: TEST_PRODUCT_1,
            product_name: "The Sovereign Oxford",
            product_slug: "shoe-2026-09-001",
            position: 0,
            is_hero: true,
            alt_text: "Hero image",
          },
          {
            product_id: TEST_PRODUCT_2,
            product_name: "The Viceroy Wholecut",
            product_slug: "shoe-2026-09-002",
            position: 2,
            is_hero: false,
            alt_text: "Alternate angle",
          },
        ],
      });

      const report = await getMediaAssetUsage(TEST_ASSET_1);

      expect(report.assetId).toBe(TEST_ASSET_1);
      expect(report.usageCount).toBe(2);
      expect(report.products[0]).toEqual({
        productId: TEST_PRODUCT_1,
        productName: "The Sovereign Oxford",
        productSlug: "shoe-2026-09-001",
        position: 0,
        isHero: true,
        altText: "Hero image",
      });
      expect(report.products[1]).toEqual({
        productId: TEST_PRODUCT_2,
        productName: "The Viceroy Wholecut",
        productSlug: "shoe-2026-09-002",
        position: 2,
        isHero: false,
        altText: "Alternate angle",
      });

      // Verify query is a single JOIN query, avoiding N+1
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("JOIN public.products p ON p.id = pm.product_id"),
        [TEST_ASSET_1],
      );
    });

    it("lists product media V1 with underlying joined asset metadata", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            pm_id: "pm-1",
            product_id: TEST_PRODUCT_1,
            media_asset_id: TEST_ASSET_1,
            position: 0,
            is_hero: true,
            alt_text: "Sovereign front",
            pm_created_at: new Date(),
            pm_updated_at: new Date(),
            ma_id: TEST_ASSET_1,
            storage_provider: "supabase",
            storage_path: "media/test/shoe-01.webp",
            original_filename: "shoe-01.webp",
            mime_type: "image/webp",
            file_size_bytes: 43720,
            width: 1200,
            height: 1200,
            dominant_color: "#e8e4dc",
            lqip: "data:image/webp;base64,sample",
            processed_variants: null,
            ma_created_at: new Date(),
            ma_updated_at: new Date(),
          },
        ],
      });

      const items = await listProductMediaV1(TEST_PRODUCT_1);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("pm-1");
      expect(items[0].is_hero).toBe(true);
      expect(items[0].asset.storage_provider).toBe("supabase");
      expect(items[0].asset.storage_path).toBe("media/test/shoe-01.webp");
    });
  });

  /* --------------------------------------------------------------------------
   * 5. Server-Only Boundary Invariants
   * -------------------------------------------------------------------------- */
  describe("5. Server-Only Boundary Invariant", () => {
    it("enforces server-only boundary in media-v1.ts", () => {
      const filePath = path.resolve(__dirname, "../media-v1.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content.startsWith('import "server-only";')).toBe(true);
    });
  });
});
