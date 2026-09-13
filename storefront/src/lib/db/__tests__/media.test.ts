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
  deleteProductMedia,
  insertProductMedia,
  listProductMedia,
  reorderProductMedia,
  setHeroMediaAtomic,
  updateMediaAltText,
} from "../media";

const TEST_PROD_ID = "11111111-1111-4111-8111-111111111111";
const TEST_MEDIA_ID = "22222222-2222-4222-8222-222222222222";
const TEST_MEDIA_ID_2 = "33333333-3333-4333-8333-333333333333";

describe("Media DAL Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listProductMedia", () => {
    it("orders images deterministically by position and creation date", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { id: TEST_MEDIA_ID, product_id: TEST_PROD_ID, position: 1, is_hero: true },
          { id: TEST_MEDIA_ID_2, product_id: TEST_PROD_ID, position: 2, is_hero: false },
        ],
      });

      const items = await listProductMedia(TEST_PROD_ID);
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(TEST_MEDIA_ID);
      expect(items[0].is_hero).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY position ASC, created_at ASC"),
        [TEST_PROD_ID],
      );
    });
  });

  describe("insertProductMedia", () => {
    it("atomically sets is_hero = true when first image for product", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Verify product exists
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: TEST_PROD_ID }] });
      // 2. Stats: no previous images, 0 heroes
      mockClient.query.mockResolvedValueOnce({ rows: [{ max_pos: null, hero_count: 0 }] });
      // 3. Clear existing hero
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 4. Insert row
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_MEDIA_ID,
            product_id: TEST_PROD_ID,
            storage_path: `products/${TEST_PROD_ID}/image.webp`,
            position: 0,
            is_hero: true,
          },
        ],
      });

      const inserted = await insertProductMedia({
        productId: TEST_PROD_ID,
        storagePath: `products/${TEST_PROD_ID}/image.webp`,
      });

      expect(inserted.is_hero).toBe(true);
      expect(inserted.position).toBe(0);
    });

    it("clears other heroes if isHero is explicitly requested on subsequent image", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Verify product exists
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: TEST_PROD_ID }] });
      // 2. Stats: 1 existing image, 1 existing hero
      mockClient.query.mockResolvedValueOnce({ rows: [{ max_pos: 0, hero_count: 1 }] });
      // 3. Clear existing heroes
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 4. Insert row
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_MEDIA_ID_2,
            product_id: TEST_PROD_ID,
            position: 1,
            is_hero: true,
          },
        ],
      });

      const inserted = await insertProductMedia({
        productId: TEST_PROD_ID,
        storagePath: `products/${TEST_PROD_ID}/image2.webp`,
        isHero: true,
      });

      expect(inserted.is_hero).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_images SET is_hero = false"),
        [TEST_PROD_ID],
      );
    });
  });

  describe("setHeroMediaAtomic", () => {
    it("atomically unsets previous hero and sets new hero within a transaction", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Verify media belongs to product
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: TEST_MEDIA_ID }] });
      // 2. Clear previous hero
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 3. Set new hero
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await setHeroMediaAtomic(TEST_PROD_ID, TEST_MEDIA_ID);

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("SET is_hero = false"),
        [TEST_PROD_ID],
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("SET is_hero = true"),
        [TEST_MEDIA_ID, TEST_PROD_ID],
      );
    });
  });

  describe("reorderProductMedia", () => {
    it("updates position of media items in order inside transaction", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Verify all media belong to product
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: TEST_MEDIA_ID }, { id: TEST_MEDIA_ID_2 }],
      });
      // 2. First update
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 3. Second update
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await reorderProductMedia(TEST_PROD_ID, [TEST_MEDIA_ID_2, TEST_MEDIA_ID]);

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE public.product_images SET position = $1"),
        [0, TEST_MEDIA_ID_2, TEST_PROD_ID],
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("UPDATE public.product_images SET position = $1"),
        [1, TEST_MEDIA_ID, TEST_PROD_ID],
      );
    });

    it("rejects duplicate IDs before executing any UPDATE (Section 15)", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // Product has 3 existing images: [A, B, C]
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: "A" }, { id: "B" }, { id: "C" }],
      });

      // Submitted: [A, A, C] (length matches 3, but contains duplicates)
      await expect(
        reorderProductMedia(TEST_PROD_ID, ["A", "A", "C"]),
      ).rejects.toThrow("duplicates");

      // Verify ZERO position updates were executed
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    it("rejects when submitted IDs count does not match existing media count", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: "A" }, { id: "B" }],
      });

      await expect(
        reorderProductMedia(TEST_PROD_ID, ["A"]),
      ).rejects.toThrow("count does not match");

      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    it("rejects cross-product media IDs", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: "A" }, { id: "B" }],
      });

      await expect(
        reorderProductMedia(TEST_PROD_ID, ["A", "FOREIGN_MEDIA_ID"]),
      ).rejects.toThrow("does not belong to product");

      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateMediaAltText", () => {
    it("updates alt text and checks product ownership", async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

      await updateMediaAltText(TEST_PROD_ID, TEST_MEDIA_ID, "New Alt Text");

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE public.product_images"),
        ["New Alt Text", TEST_MEDIA_ID, TEST_PROD_ID],
      );
    });
  });

  describe("deleteProductMedia", () => {
    it("promotes next available image to hero if deleted image was the hero", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Fetch media item
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_MEDIA_ID,
            product_id: TEST_PROD_ID,
            is_hero: true,
            storage_path: `products/${TEST_PROD_ID}/hero.webp`,
            processed_variants: { "320": { webp: `products/${TEST_PROD_ID}/320.webp` } },
          },
        ],
      });

      // 2. Delete from DB
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // 3. Promote next image to hero
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: TEST_MEDIA_ID_2 }],
      });

      // 4. Update next image is_hero = true
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await deleteProductMedia(TEST_PROD_ID, TEST_MEDIA_ID);

      expect(result.deletedMediaId).toBe(TEST_MEDIA_ID);
      expect(result.newHeroMediaId).toBe(TEST_MEDIA_ID_2);
      expect(result.storagePathsToDelete).toContain(`products/${TEST_PROD_ID}/hero.webp`);
      expect(result.storagePathsToDelete).toContain(`products/${TEST_PROD_ID}/320.webp`);
    });

    it("produces media-less state without error when deleting the last remaining image", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // 1. Fetch sole media item
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_MEDIA_ID,
            product_id: TEST_PROD_ID,
            is_hero: true,
            storage_path: `products/${TEST_PROD_ID}/final.webp`,
            processed_variants: null,
          },
        ],
      });

      // 2. Delete from DB
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // 3. Check remaining: 0 rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await deleteProductMedia(TEST_PROD_ID, TEST_MEDIA_ID);

      expect(result.deletedMediaId).toBe(TEST_MEDIA_ID);
      expect(result.newHeroMediaId).toBeNull();
      expect(result.storagePathsToDelete).toEqual([`products/${TEST_PROD_ID}/final.webp`]);
    });

    it("deduplicates storage paths before deletion (Section 16)", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockClient));

      // storage_path and a processed_variant share the same path
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_MEDIA_ID,
            product_id: TEST_PROD_ID,
            is_hero: false,
            storage_path: `products/${TEST_PROD_ID}/shared.webp`,
            processed_variants: {
              "640": { webp: `products/${TEST_PROD_ID}/shared.webp` },
              "320": { webp: `products/${TEST_PROD_ID}/thumb.webp` },
            },
          },
        ],
      });

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await deleteProductMedia(TEST_PROD_ID, TEST_MEDIA_ID);

      expect(result.storagePathsToDelete).toEqual([
        `products/${TEST_PROD_ID}/shared.webp`,
        `products/${TEST_PROD_ID}/thumb.webp`,
      ]);
    });
  });
});
