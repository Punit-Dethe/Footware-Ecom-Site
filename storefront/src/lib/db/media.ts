import "server-only";

import type { PoolClient } from "pg";
import { query, transaction } from "./index";
import type { ResponsiveVariantsSchema } from "@/lib/media/delivery";

export interface DbProductImageRow {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  is_hero: boolean;
  width: number | null;
  height: number | null;
  dominant_color: string | null;
  lqip: string | null;
  processed_variants: ResponsiveVariantsSchema | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertProductMediaInput {
  id?: string;
  productId: string;
  storagePath: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  dominantColor?: string | null;
  lqip?: string | null;
  processedVariants?: ResponsiveVariantsSchema | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  isHero?: boolean;
}

/**
 * Lists all media rows for a product ordered deterministically by position, then created_at.
 */
export async function listProductMedia(
  productId: string,
  client?: PoolClient,
): Promise<DbProductImageRow[]> {
  const runner = client ? client.query.bind(client) : query;
  const res = await runner<DbProductImageRow>(
    `SELECT id, product_id, storage_path, alt_text, position, is_hero,
            width, height, dominant_color, lqip, processed_variants,
            original_filename, mime_type, file_size_bytes, created_at, updated_at
     FROM public.product_images
     WHERE product_id = $1
     ORDER BY position ASC, created_at ASC;`,
    [productId],
  );
  return res.rows;
}

/**
 * Inserts a new product media record transactionally.
 * If this is the first image for the product or isHero is true, atomically sets is_hero = true.
 */
export async function insertProductMedia(
  input: InsertProductMediaInput,
): Promise<DbProductImageRow> {
  return transaction(async (client) => {
    // 1. Verify product exists
    const prodCheck = await client.query<{ id: string }>(
      `SELECT id FROM public.products WHERE id = $1;`,
      [input.productId],
    );
    if (prodCheck.rows.length === 0) {
      throw new Error(`Cannot add media: Product '${input.productId}' does not exist.`);
    }

    // 2. Determine max position and hero status
    const statsRes = await client.query<{ max_pos: number | null; hero_count: number }>(
      `SELECT MAX(position) AS max_pos, COUNT(id) FILTER (WHERE is_hero = true)::int AS hero_count
       FROM public.product_images
       WHERE product_id = $1;`,
      [input.productId],
    );

    const currentMax = statsRes.rows[0]?.max_pos;
    const nextPosition = currentMax == null ? 0 : currentMax + 1;
    const shouldBeHero = Boolean(input.isHero) || (statsRes.rows[0]?.hero_count === 0);

    if (shouldBeHero) {
      // Clear existing hero inside same transaction
      await client.query(
        `UPDATE public.product_images SET is_hero = false, updated_at = NOW() WHERE product_id = $1;`,
        [input.productId],
      );
    }

    const res = await client.query<DbProductImageRow>(
      `INSERT INTO public.product_images (
        ${input.id ? "id," : ""}
        product_id, storage_path, alt_text, position, is_hero,
        width, height, dominant_color, lqip, processed_variants,
        original_filename, mime_type, file_size_bytes, created_at, updated_at
      ) VALUES (
        ${input.id ? "$1," : ""}
        $${input.id ? "2" : "1"},
        $${input.id ? "3" : "2"},
        $${input.id ? "4" : "3"},
        $${input.id ? "5" : "4"},
        $${input.id ? "6" : "5"},
        $${input.id ? "7" : "6"},
        $${input.id ? "8" : "7"},
        $${input.id ? "9" : "8"},
        $${input.id ? "10" : "9"},
        $${input.id ? "11" : "10"},
        $${input.id ? "12" : "11"},
        $${input.id ? "13" : "12"},
        $${input.id ? "14" : "13"},
        NOW(), NOW()
      ) RETURNING *;`,
      input.id
        ? [
            input.id,
            input.productId,
            input.storagePath,
            input.altText || null,
            nextPosition,
            shouldBeHero,
            input.width || null,
            input.height || null,
            input.dominantColor || null,
            input.lqip || null,
            input.processedVariants ? JSON.stringify(input.processedVariants) : null,
            input.originalFilename || null,
            input.mimeType || null,
            input.fileSizeBytes || null,
          ]
        : [
            input.productId,
            input.storagePath,
            input.altText || null,
            nextPosition,
            shouldBeHero,
            input.width || null,
            input.height || null,
            input.dominantColor || null,
            input.lqip || null,
            input.processedVariants ? JSON.stringify(input.processedVariants) : null,
            input.originalFilename || null,
            input.mimeType || null,
            input.fileSizeBytes || null,
          ],
    );

    return res.rows[0];
  });
}

/**
 * Atomically sets image B as hero and clears any existing hero for the product.
 * Enforces product ownership.
 */
export async function setHeroMediaAtomic(
  productId: string,
  mediaId: string,
): Promise<void> {
  return transaction(async (client) => {
    // Verify media belongs to product
    const check = await client.query<{ id: string }>(
      `SELECT id FROM public.product_images WHERE id = $1 AND product_id = $2;`,
      [mediaId, productId],
    );
    if (check.rows.length === 0) {
      throw new Error(`Media '${mediaId}' does not belong to product '${productId}'.`);
    }

    // Atomically clear hero and set new hero
    await client.query(
      `UPDATE public.product_images SET is_hero = false, updated_at = NOW() WHERE product_id = $1;`,
      [productId],
    );

    await client.query(
      `UPDATE public.product_images SET is_hero = true, updated_at = NOW() WHERE id = $1 AND product_id = $2;`,
      [mediaId, productId],
    );
  });
}

/**
 * Reorders product media deterministically.
 * Verifies every media ID strictly belongs to the target product (tamper-proof).
 */
export async function reorderProductMedia(
  productId: string,
  mediaIds: string[],
): Promise<void> {
  return transaction(async (client) => {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM public.product_images WHERE product_id = $1;`,
      [productId],
    );
    const existingIds = new Set(existing.rows.map((r) => r.id));

    if (mediaIds.length !== existingIds.size) {
      throw new Error("Reorder rejected: provided media IDs count does not match product media count.");
    }

    for (const id of mediaIds) {
      if (!existingIds.has(id)) {
        throw new Error(`Reorder rejected: media ID '${id}' does not belong to product '${productId}'.`);
      }
    }

    // Apply normalized sequential positions (0, 1, 2...)
    for (let pos = 0; pos < mediaIds.length; pos++) {
      await client.query(
        `UPDATE public.product_images SET position = $1, updated_at = NOW() WHERE id = $2 AND product_id = $3;`,
        [pos, mediaIds[pos], productId],
      );
    }
  });
}

/**
 * Updates alt text for a media record with product ownership verification.
 */
export async function updateMediaAltText(
  productId: string,
  mediaId: string,
  altText: string | null,
): Promise<void> {
  const res = await query(
    `UPDATE public.product_images
     SET alt_text = $1, updated_at = NOW()
     WHERE id = $2 AND product_id = $3;`,
    [altText, mediaId, productId],
  );

  if (res.rowCount === 0) {
    throw new Error(`Media '${mediaId}' does not belong to product '${productId}'.`);
  }
}

export interface DeleteProductMediaResult {
  deletedMediaId: string;
  storagePathsToDelete: string[];
  newHeroMediaId: string | null;
}

/**
 * Deletes a product media item from PostgreSQL first inside a transaction.
 * If the deleted media was hero and others remain, transactionally promotes the next lowest-position image.
 * Returns all associated storage paths (including processed variants) for post-commit storage deletion.
 */
export async function deleteProductMedia(
  productId: string,
  mediaId: string,
): Promise<DeleteProductMediaResult> {
  return transaction(async (client) => {
    // 1. Fetch the media item and verify product ownership
    const mediaRes = await client.query<DbProductImageRow>(
      `SELECT * FROM public.product_images WHERE id = $1 AND product_id = $2;`,
      [mediaId, productId],
    );

    if (mediaRes.rows.length === 0) {
      throw new Error(`Cannot delete: Media '${mediaId}' does not belong to product '${productId}'.`);
    }

    const targetMedia = mediaRes.rows[0];
    const wasHero = targetMedia.is_hero;

    // Collect all associated storage paths to delete
    const pathsToDelete: string[] = [targetMedia.storage_path];
    if (targetMedia.processed_variants && typeof targetMedia.processed_variants === "object") {
      for (const formats of Object.values(targetMedia.processed_variants)) {
        if (formats?.avif) pathsToDelete.push(formats.avif);
        if (formats?.webp) pathsToDelete.push(formats.webp);
      }
    }

    // 2. Delete the DB record first
    await client.query(
      `DELETE FROM public.product_images WHERE id = $1 AND product_id = $2;`,
      [mediaId, productId],
    );

    let newHeroId: string | null = null;

    // 3. If it was hero, check if other media remain and promote lowest-position remaining
    if (wasHero) {
      const remaining = await client.query<{ id: string }>(
        `SELECT id FROM public.product_images
         WHERE product_id = $1
         ORDER BY position ASC, created_at ASC
         LIMIT 1;`,
        [productId],
      );

      if (remaining.rows.length > 0) {
        newHeroId = remaining.rows[0].id;
        await client.query(
          `UPDATE public.product_images SET is_hero = true, updated_at = NOW() WHERE id = $1;`,
          [newHeroId],
        );
      }
    }

    return {
      deletedMediaId: mediaId,
      storagePathsToDelete: pathsToDelete,
      newHeroMediaId: newHeroId,
    };
  });
}
