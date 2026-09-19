import "server-only";

import type { PoolClient } from "pg";
import { query, transaction } from "./index";
import {
  getStoragePublicUrl,
  type ResponsiveVariantsSchema,
} from "@/lib/media/delivery";
import { MediaDomainError } from "@/lib/media/errors";

export { MediaDomainError };

export type StorageProvider = "supabase" | string;

export interface DbMediaAsset {
  id: string;
  storage_provider: StorageProvider;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  dominant_color: string | null;
  lqip: string | null;
  processed_variants: ResponsiveVariantsSchema | null;
  content_sha256?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbProductMedia {
  id: string;
  product_id: string;
  media_asset_id: string;
  position: number;
  is_hero: boolean;
  alt_text: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductMediaV1WithAsset extends DbProductMedia {
  asset: DbMediaAsset;
}

export interface CreateMediaAssetInput {
  id?: string;
  storageProvider?: StorageProvider;
  storagePath: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  dominantColor?: string | null;
  lqip?: string | null;
  processedVariants?: ResponsiveVariantsSchema | null;
  contentSha256?: string | null;
}

export interface AttachMediaInput {
  id?: string;
  productId: string;
  mediaAssetId: string;
  position?: number;
  isHero?: boolean;
  altText?: string | null;
}

export interface ListMediaAssetsParams {
  storageProvider?: StorageProvider;
  limit?: number;
  offset?: number;
}

export interface MediaLibraryAssetItem extends DbMediaAsset {
  publicUrl: string;
  usageCount: number;
}

export interface ListMediaLibraryAssetsParams {
  query?: string;
  provider?: StorageProvider;
  limit?: number;
  offset?: number;
  sort?: "created_desc" | "created_asc" | "size_desc" | "size_asc";
}

export interface ListMediaLibraryAssetsResult {
  items: MediaLibraryAssetItem[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface MediaProductUsageItem {
  productId: string;
  productName: string;
  productSlug: string;
  position: number;
  isHero: boolean;
  altText: string | null;
}

export interface MediaAssetUsageReport {
  assetId: string;
  usageCount: number;
  products: MediaProductUsageItem[];
}

export interface MediaLibraryAssetDetail extends DbMediaAsset {
  publicUrl: string;
  usage: MediaAssetUsageReport;
}

/**
 * Creates a global reusable media asset record.
 */
export async function createMediaAsset(
  input: CreateMediaAssetInput,
  client?: PoolClient,
): Promise<DbMediaAsset> {
  const runner = client ? client.query.bind(client) : query;
  const provider = input.storageProvider || "supabase";

  try {
    const res = await runner<DbMediaAsset>(
      `INSERT INTO public.media_assets (
        ${input.id ? "id," : ""}
        storage_provider, storage_path, original_filename, mime_type, file_size_bytes,
        width, height, dominant_color, lqip, processed_variants, content_sha256,
        created_at, updated_at
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
        NOW(), NOW()
      ) RETURNING *;`,
      input.id
        ? [
            input.id,
            provider,
            input.storagePath,
            input.originalFilename || null,
            input.mimeType || null,
            input.fileSizeBytes || null,
            input.width || null,
            input.height || null,
            input.dominantColor || null,
            input.lqip || null,
            input.processedVariants ? JSON.stringify(input.processedVariants) : null,
            input.contentSha256 || null,
          ]
        : [
            provider,
            input.storagePath,
            input.originalFilename || null,
            input.mimeType || null,
            input.fileSizeBytes || null,
            input.width || null,
            input.height || null,
            input.dominantColor || null,
            input.lqip || null,
            input.processedVariants ? JSON.stringify(input.processedVariants) : null,
            input.contentSha256 || null,
          ],
    );

    return res.rows[0];
  } catch (err: any) {
    if (err?.code === "23505") {
      throw new MediaDomainError(
        `Media asset with storage path '${input.storagePath}' already exists for provider '${provider}'.`,
      );
    }
    throw err;
  }
}

/**
 * Retrieves a single media asset by ID.
 */
export async function getMediaAsset(
  id: string,
  client?: PoolClient,
): Promise<DbMediaAsset | null> {
  const runner = client ? client.query.bind(client) : query;
  const res = await runner<DbMediaAsset>(
    `SELECT * FROM public.media_assets WHERE id = $1;`,
    [id],
  );
  return res.rows[0] || null;
}

/**
 * Lists global media assets with optional provider filtering and pagination.
 */
export async function listMediaAssets(
  params?: ListMediaAssetsParams,
  client?: PoolClient,
): Promise<DbMediaAsset[]> {
  const runner = client ? client.query.bind(client) : query;
  const conditions: string[] = [];
  const values: any[] = [];

  if (params?.storageProvider) {
    values.push(params.storageProvider);
    conditions.push(`storage_provider = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
  const offset = Math.max(params?.offset ?? 0, 0);

  values.push(limit);
  const limitClause = `LIMIT $${values.length}`;
  values.push(offset);
  const offsetClause = `OFFSET $${values.length}`;

  const res = await runner<DbMediaAsset>(
    `SELECT * FROM public.media_assets
     ${whereClause}
     ORDER BY created_at DESC, id ASC
     ${limitClause} ${offsetClause};`,
    values,
  );

  return res.rows;
}

/**
 * Deletes a global media asset.
 * Prevents deletion if the asset is currently referenced by any products.
 */
export async function deleteMediaAsset(
  id: string,
  client?: PoolClient,
): Promise<void> {
  const runner = client ? client.query.bind(client) : query;
  try {
    const res = await runner(
      `DELETE FROM public.media_assets WHERE id = $1;`,
      [id],
    );
    if (res.rowCount === 0) {
      throw new MediaDomainError(`Media asset '${id}' not found.`);
    }
  } catch (err: any) {
    if (err?.code === "23503") {
      throw new MediaDomainError(
        `Cannot delete media asset '${id}': It is currently referenced by one or more products. Detach it from all products first.`,
      );
    }
    throw err;
  }
}

/**
 * Reports current product usage for a global media asset in a single query.
 * Avoids N+1 query patterns.
 */
export async function getMediaAssetUsage(
  assetId: string,
  client?: PoolClient,
): Promise<MediaAssetUsageReport> {
  const runner = client ? client.query.bind(client) : query;
  const res = await runner<{
    product_id: string;
    product_name: string;
    product_slug: string;
    position: number;
    is_hero: boolean;
    alt_text: string | null;
  }>(
    `SELECT
       pm.product_id,
       p.name AS product_name,
       p.slug AS product_slug,
       pm.position,
       pm.is_hero,
       pm.alt_text
     FROM public.product_media pm
     JOIN public.products p ON p.id = pm.product_id
     WHERE pm.media_asset_id = $1
     ORDER BY p.name ASC, pm.position ASC;`,
    [assetId],
  );

  const products: MediaProductUsageItem[] = res.rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    position: row.position,
    isHero: row.is_hero,
    altText: row.alt_text,
  }));

  return {
    assetId,
    usageCount: products.length,
    products,
  };
}

/**
 * Lists all media items attached to a product, ordered deterministically,
 * including full underlying asset metadata.
 */
export async function listProductMediaV1(
  productId: string,
  client?: PoolClient,
): Promise<ProductMediaV1WithAsset[]> {
  const runner = client ? client.query.bind(client) : query;
  const res = await runner<{
    pm_id: string;
    product_id: string;
    media_asset_id: string;
    position: number;
    is_hero: boolean;
    alt_text: string | null;
    pm_created_at: Date;
    pm_updated_at: Date;
    ma_id: string;
    storage_provider: StorageProvider;
    storage_path: string;
    original_filename: string | null;
    mime_type: string | null;
    file_size_bytes: number | null;
    width: number | null;
    height: number | null;
    dominant_color: string | null;
    lqip: string | null;
    processed_variants: ResponsiveVariantsSchema | null;
    ma_created_at: Date;
    ma_updated_at: Date;
  }>(
    `SELECT
       pm.id AS pm_id,
       pm.product_id,
       pm.media_asset_id,
       pm.position,
       pm.is_hero,
       pm.alt_text,
       pm.created_at AS pm_created_at,
       pm.updated_at AS pm_updated_at,
       ma.id AS ma_id,
       ma.storage_provider,
       ma.storage_path,
       ma.original_filename,
       ma.mime_type,
       ma.file_size_bytes,
       ma.width,
       ma.height,
       ma.dominant_color,
       ma.lqip,
       ma.processed_variants,
       ma.created_at AS ma_created_at,
       ma.updated_at AS ma_updated_at
     FROM public.product_media pm
     JOIN public.media_assets ma ON ma.id = pm.media_asset_id
     WHERE pm.product_id = $1
     ORDER BY pm.position ASC, pm.created_at ASC;`,
    [productId],
  );

  return res.rows.map((row) => ({
    id: row.pm_id,
    product_id: row.product_id,
    media_asset_id: row.media_asset_id,
    position: row.position,
    is_hero: row.is_hero,
    alt_text: row.alt_text,
    created_at: row.pm_created_at,
    updated_at: row.pm_updated_at,
    asset: {
      id: row.ma_id,
      storage_provider: row.storage_provider,
      storage_path: row.storage_path,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      file_size_bytes: row.file_size_bytes,
      width: row.width,
      height: row.height,
      dominant_color: row.dominant_color,
      lqip: row.lqip,
      processed_variants: row.processed_variants,
      created_at: row.ma_created_at,
      updated_at: row.ma_updated_at,
    },
  }));
}

/**
 * Attaches an existing media asset to a product.
 * Guarantees at most one hero per product and deterministic positioning.
 */
export async function attachMediaToProduct(
  input: AttachMediaInput,
  client?: PoolClient,
): Promise<DbProductMedia> {
  const execute = async (c: PoolClient): Promise<DbProductMedia> => {
    // 1. Verify product exists
    const prodCheck = await c.query<{ id: string }>(
      `SELECT id FROM public.products WHERE id = $1;`,
      [input.productId],
    );
    if (prodCheck.rows.length === 0) {
      throw new MediaDomainError(`Cannot attach media: Product '${input.productId}' does not exist.`);
    }

    // 2. Verify media asset exists
    const assetCheck = await c.query<{ id: string }>(
      `SELECT id FROM public.media_assets WHERE id = $1;`,
      [input.mediaAssetId],
    );
    if (assetCheck.rows.length === 0) {
      throw new MediaDomainError(`Cannot attach media: Media asset '${input.mediaAssetId}' does not exist.`);
    }

    // 3. Determine positioning and hero status
    const statsRes = await c.query<{ max_pos: number | null; count: number; hero_count: number }>(
      `SELECT
         MAX(position) AS max_pos,
         COUNT(id)::int AS count,
         COUNT(id) FILTER (WHERE is_hero = true)::int AS hero_count
       FROM public.product_media
       WHERE product_id = $1;`,
      [input.productId],
    );

    const isFirstMedia = (statsRes.rows[0]?.count ?? 0) === 0;
    const shouldBeHero = Boolean(input.isHero) || isFirstMedia;
    const nextPosition =
      input.position ?? (statsRes.rows[0]?.max_pos == null ? 0 : statsRes.rows[0].max_pos + 1);

    if (shouldBeHero) {
      // Atomically clear any existing hero for this product
      await c.query(
        `UPDATE public.product_media SET is_hero = false, updated_at = NOW() WHERE product_id = $1;`,
        [input.productId],
      );
    }

    try {
      const res = await c.query<DbProductMedia>(
        `INSERT INTO public.product_media (
          ${input.id ? "id," : ""}
          product_id, media_asset_id, position, is_hero, alt_text, created_at, updated_at
        ) VALUES (
          ${input.id ? "$1," : ""}
          $${input.id ? "2" : "1"},
          $${input.id ? "3" : "2"},
          $${input.id ? "4" : "3"},
          $${input.id ? "5" : "4"},
          $${input.id ? "6" : "5"},
          NOW(), NOW()
        ) RETURNING *;`,
        input.id
          ? [input.id, input.productId, input.mediaAssetId, nextPosition, shouldBeHero, input.altText || null]
          : [input.productId, input.mediaAssetId, nextPosition, shouldBeHero, input.altText || null],
      );

      return res.rows[0];
    } catch (err: any) {
      if (err?.code === "23505") {
        throw new MediaDomainError(
          `Media asset '${input.mediaAssetId}' is already attached to product '${input.productId}'.`,
        );
      }
      throw err;
    }
  };

  return client ? execute(client) : transaction(execute);
}

/**
 * Detaches a media asset from a product.
 * Does NOT delete the underlying global media_assets record.
 * Promotes the lowest-position remaining image if the detached item was hero.
 */
export async function detachMediaFromProduct(
  productId: string,
  mediaAssetId: string,
  client?: PoolClient,
): Promise<void> {
  const execute = async (c: PoolClient): Promise<void> => {
    // 1. Fetch the association
    const currentRes = await c.query<DbProductMedia>(
      `SELECT * FROM public.product_media WHERE product_id = $1 AND media_asset_id = $2;`,
      [productId, mediaAssetId],
    );

    if (currentRes.rows.length === 0) {
      throw new MediaDomainError(
        `Cannot detach: Media asset '${mediaAssetId}' is not attached to product '${productId}'.`,
      );
    }

    const wasHero = currentRes.rows[0].is_hero;

    // 2. Delete the association
    await c.query(
      `DELETE FROM public.product_media WHERE product_id = $1 AND media_asset_id = $2;`,
      [productId, mediaAssetId],
    );

    // 3. If it was hero, promote next available non-legacy managed image
    if (wasHero) {
      const remaining = await c.query<{ id: string }>(
        `SELECT pm.id FROM public.product_media pm
         JOIN public.media_assets ma ON ma.id = pm.media_asset_id
         WHERE pm.product_id = $1
         ORDER BY pm.position ASC, pm.created_at ASC
         LIMIT 1;`,
        [productId],
      );

      if (remaining.rows.length > 0) {
        await c.query(
          `UPDATE public.product_media SET is_hero = true, updated_at = NOW() WHERE id = $1;`,
          [remaining.rows[0].id],
        );
      }
    }
  };

  return client ? execute(client) : transaction(execute);
}

/**
 * Atomically sets a product's hero media asset and clears any existing hero.
 */
export async function setProductHeroMedia(
  productId: string,
  mediaAssetId: string,
  client?: PoolClient,
): Promise<void> {
  const execute = async (c: PoolClient): Promise<void> => {
    // Verify association exists
    const check = await c.query<{ id: string }>(
      `SELECT id FROM public.product_media WHERE product_id = $1 AND media_asset_id = $2;`,
      [productId, mediaAssetId],
    );

    if (check.rows.length === 0) {
      throw new MediaDomainError(
        `Media asset '${mediaAssetId}' is not attached to product '${productId}'.`,
      );
    }

    // Atomically clear current hero and set new hero
    await c.query(
      `UPDATE public.product_media SET is_hero = false, updated_at = NOW() WHERE product_id = $1;`,
      [productId],
    );

    await c.query(
      `UPDATE public.product_media SET is_hero = true, updated_at = NOW() WHERE product_id = $1 AND media_asset_id = $2;`,
      [productId, mediaAssetId],
    );
  };

  return client ? execute(client) : transaction(execute);
}

/**
 * Reorders a product's media associations deterministically.
 * Enforces exact set equality and no duplicates.
 */
export async function reorderProductMediaV1(
  productId: string,
  mediaAssetIds: string[],
  client?: PoolClient,
): Promise<void> {
  const execute = async (c: PoolClient): Promise<void> => {
    // 1. Fetch existing media asset IDs for the product
    const existing = await c.query<{ media_asset_id: string }>(
      `SELECT media_asset_id FROM public.product_media WHERE product_id = $1;`,
      [productId],
    );

    const existingIds = new Set(existing.rows.map((r) => r.media_asset_id));

    // Guard against duplicate IDs in submitted payload
    if (new Set(mediaAssetIds).size !== mediaAssetIds.length) {
      throw new MediaDomainError("Reorder rejected: submitted media asset IDs contain duplicates.");
    }

    // Exact count and set equality check
    if (mediaAssetIds.length !== existingIds.size) {
      throw new MediaDomainError(
        "Reorder rejected: provided media asset IDs count does not match product media count.",
      );
    }

    for (const id of mediaAssetIds) {
      if (!existingIds.has(id)) {
        throw new MediaDomainError(
          `Reorder rejected: media asset '${id}' is not attached to product '${productId}'.`,
        );
      }
    }

    // Apply normalized sequential positions (0, 1, 2...)
    for (let pos = 0; pos < mediaAssetIds.length; pos++) {
      await c.query(
        `UPDATE public.product_media SET position = $1, updated_at = NOW()
         WHERE product_id = $2 AND media_asset_id = $3;`,
        [pos, productId, mediaAssetIds[pos]],
      );
    }
  };

  return client ? execute(client) : transaction(execute);
}

/**
 * Updates placement alt text for a specific product media association.
 */
export async function updateProductMediaAltTextV1(
  productId: string,
  mediaAssetId: string,
  altText: string | null,
  client?: PoolClient,
): Promise<void> {
  const runner = client ? client.query.bind(client) : query;
  const cleanAlt =
    altText && altText.trim().length > 0 ? altText.trim().slice(0, 255) : null;

  const res = await runner(
    `UPDATE public.product_media
     SET alt_text = $1, updated_at = NOW()
     WHERE product_id = $2 AND media_asset_id = $3;`,
    [cleanAlt, productId, mediaAssetId],
  );

  if (res.rowCount === 0) {
    throw new MediaDomainError(
      `Cannot update alt text: Media asset '${mediaAssetId}' is not attached to product '${productId}'.`,
    );
  }
}

/**
 * Lists global Media Library assets with pagination, search, sorting, and bounded usage count.
 * Guaranteed 0 N+1 queries.
 */
export async function listMediaLibraryAssets(
  params?: ListMediaLibraryAssetsParams,
  client?: PoolClient,
): Promise<ListMediaLibraryAssetsResult> {
  const runner = client ? client.query.bind(client) : query;
  const conditions: string[] = [];
  const values: any[] = [];

  if (params?.provider) {
    values.push(params.provider);
    conditions.push(`ma.storage_provider = $${values.length}`);
  }

  if (params?.query && params.query.trim().length > 0) {
    values.push(`%${params.query.trim()}%`);
    conditions.push(
      `(ma.original_filename ILIKE $${values.length} OR ma.storage_path ILIKE $${values.length})`,
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "ma.created_at DESC, ma.id ASC";
  switch (params?.sort) {
    case "created_asc":
      orderBy = "ma.created_at ASC, ma.id ASC";
      break;
    case "size_desc":
      orderBy = "ma.file_size_bytes DESC NULLS LAST, ma.created_at DESC";
      break;
    case "size_asc":
      orderBy = "ma.file_size_bytes ASC NULLS LAST, ma.created_at DESC";
      break;
    default:
      orderBy = "ma.created_at DESC, ma.id ASC";
      break;
  }

  const limit = Math.min(Math.max(params?.limit ?? 24, 1), 100);
  const offset = Math.max(params?.offset ?? 0, 0);

  values.push(limit);
  const limitPlaceholder = `$${values.length}`;
  values.push(offset);
  const offsetPlaceholder = `$${values.length}`;

  const sql = `
    SELECT
      ma.id,
      ma.storage_provider,
      ma.storage_path,
      ma.original_filename,
      ma.mime_type,
      ma.file_size_bytes,
      ma.width,
      ma.height,
      ma.dominant_color,
      ma.lqip,
      ma.processed_variants,
      ma.content_sha256,
      ma.created_at,
      ma.updated_at,
      (
        SELECT COUNT(*)::int
        FROM public.product_media pm
        WHERE pm.media_asset_id = ma.id
      ) AS usage_count,
      COUNT(*) OVER()::int AS full_count
    FROM public.media_assets ma
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
  `;

  const res = await runner<{
    id: string;
    storage_provider: StorageProvider;
    storage_path: string;
    original_filename: string | null;
    mime_type: string | null;
    file_size_bytes: number | string | null;
    width: number | null;
    height: number | null;
    dominant_color: string | null;
    lqip: string | null;
    processed_variants: ResponsiveVariantsSchema | null;
    content_sha256: string | null;
    created_at: Date;
    updated_at: Date;
    usage_count: number;
    full_count: number;
  }>(sql, values);

  const totalCount = res.rows[0]?.full_count ?? 0;
  const items: MediaLibraryAssetItem[] = res.rows.map((row) => ({
    id: row.id,
    storage_provider: row.storage_provider,
    storage_path: row.storage_path,
    original_filename: row.original_filename,
    mime_type: row.mime_type,
    file_size_bytes:
      row.file_size_bytes != null ? Number(row.file_size_bytes) : null,
    width: row.width,
    height: row.height,
    dominant_color: row.dominant_color,
    lqip: row.lqip,
    processed_variants: row.processed_variants,
    content_sha256: row.content_sha256,
    created_at: row.created_at,
    updated_at: row.updated_at,
    usageCount: Number(row.usage_count || 0),
    publicUrl: getStoragePublicUrl(row.storage_path),
  }));

  return {
    items,
    totalCount,
    limit,
    offset,
  };
}

/**
 * Retrieves a single Media Library asset by ID, including resolved public URL
 * and complete product usage report.
 */
export async function getMediaLibraryAsset(
  id: string,
  client?: PoolClient,
): Promise<MediaLibraryAssetDetail | null> {
  const asset = await getMediaAsset(id, client);
  if (!asset) return null;

  const usage = await getMediaAssetUsage(id, client);

  return {
    ...asset,
    publicUrl: getStoragePublicUrl(asset.storage_path),
    usage,
  };
}
