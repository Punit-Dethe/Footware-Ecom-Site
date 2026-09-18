"use server";

import crypto from "node:crypto";
import path from "node:path";
import { updateTag } from "next/cache";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { AdminAuthError, requireAdmin } from "@/lib/auth/admin";
import { query, transaction } from "@/lib/db";
import {
  attachMediaToProduct,
  createMediaAsset,
  deleteMediaAsset,
  detachMediaFromProduct,
  getMediaAsset,
  getMediaAssetUsage,
  getMediaLibraryAsset,
  listMediaLibraryAssets,
  listProductMediaV1,
  reorderProductMediaV1,
  setProductHeroMedia,
  updateProductMediaAltTextV1,
  type DbMediaAsset,
  type ListMediaLibraryAssetsResult,
  type MediaLibraryAssetDetail,
} from "@/lib/db/media-v1";
import type { AdminProductMediaPlacement } from "@/lib/db/admin-catalog";
import { getStoragePublicUrl } from "@/lib/media/delivery";
import { MediaDomainError, MediaValidationError } from "@/lib/media/errors";
import {
  createSignedMediaUploadUrl,
  deleteStorageObjects,
  downloadStorageObject,
  generateGlobalMediaStoragePath,
} from "@/lib/media/storage-admin";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function handleMediaActionError(err: unknown): {
  success: false;
  error: string;
} {
  if (
    err instanceof AdminAuthError ||
    (err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "AdminAuthError") ||
    (err instanceof Error && err.message === "Admin authorization required.")
  ) {
    const code = (err as any)?.code;
    if (code === "INFRASTRUCTURE_ERROR") {
      console.error("[admin-media-library] Auth infrastructure error:", err);
      return {
        success: false,
        error: "Authorization service is temporarily unavailable.",
      };
    }
    return {
      success: false,
      error: "Admin authorization required.",
    };
  }

  if (
    err instanceof MediaValidationError ||
    (err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "MediaValidationError")
  ) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }

  if (
    err instanceof MediaDomainError ||
    (err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "MediaDomainError")
  ) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }

  console.error("[admin-media-library] Unexpected action failure:", err);
  return {
    success: false,
    error: "Failed to process media request.",
  };
}

function sanitizeFilename(filename?: string | null): string | null {
  if (!filename) return null;
  const basename = path.basename(filename).trim();
  if (!basename) return null;
  return basename.slice(0, 255);
}

// ----------------------------------------------------------------------------
// 1. Upload Authorization (Request Signed Direct Upload URL)
// ----------------------------------------------------------------------------

export interface RequestMediaLibraryUploadResult {
  success: boolean;
  signedUrl?: string;
  token?: string;
  storagePath?: string;
  assetId?: string;
  error?: string;
}

/**
 * Step 1: Request signed upload authorization for a new global Media Library asset.
 * Enforces admin auth, file size limits (<= 10MB), and supported MIME types.
 * Binds upload to canonical global namespace: media/{assetId}/original.{ext}
 */
export async function requestMediaLibraryUploadAction(
  filename: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<RequestMediaLibraryUploadResult> {
  try {
    await requireAdmin();

    if (!filename || typeof filename !== "string" || !filename.trim()) {
      throw new MediaValidationError("Filename is required.");
    }

    if (
      !fileSizeBytes ||
      typeof fileSizeBytes !== "number" ||
      fileSizeBytes <= 0
    ) {
      throw new MediaValidationError("File size must be greater than 0 bytes.");
    }

    if (fileSizeBytes > MAX_UPLOAD_BYTES) {
      throw new MediaValidationError(
        `File size exceeds 10 MB limit (${Math.round(fileSizeBytes / 1024 / 1024)} MB).`,
      );
    }

    const cleanMime = mimeType?.toLowerCase().trim();
    if (!cleanMime || !MIME_TO_EXT[cleanMime]) {
      if (
        cleanMime === "image/svg+xml" ||
        filename.toLowerCase().endsWith(".svg")
      ) {
        throw new MediaValidationError("SVG images are not allowed.");
      }
      throw new MediaValidationError(
        `Disallowed image type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, AVIF.`,
      );
    }

    const ext = MIME_TO_EXT[cleanMime];
    const assetId = crypto.randomUUID();
    const { storagePath } = generateGlobalMediaStoragePath(ext, assetId);

    const { signedUrl, token } = await createSignedMediaUploadUrl(storagePath);

    return {
      success: true,
      signedUrl,
      token,
      storagePath,
      assetId,
    };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

// ----------------------------------------------------------------------------
// 2. Upload Finalization
// ----------------------------------------------------------------------------

export interface FinalizeMediaLibraryUploadInput {
  assetId: string;
  storagePath: string;
  originalFilename?: string;
  mimeType?: string;
}

export interface FinalizeMediaLibraryUploadResult {
  success: boolean;
  asset?: DbMediaAsset;
  error?: string;
}

/**
 * Step 2: Finalize direct client upload for a global Media Library asset.
 * Validates untrusted input, verifies image bytes server-side with Sharp,
 * computes LQIP, dominant color, dimensions, and SHA-256 integrity hash,
 * and creates public.media_assets record. Does NOT attach to product.
 */
export async function finalizeMediaLibraryUploadAction(
  input: FinalizeMediaLibraryUploadInput,
): Promise<FinalizeMediaLibraryUploadResult> {
  const { assetId, storagePath } = input;

  try {
    await requireAdmin();

    // 1. Untrusted input validation
    if (!assetId || !UUID_REGEX.test(assetId)) {
      throw new MediaValidationError("Valid asset ID (UUID) is required.");
    }

    // Path must strictly bind to: media/<assetId>/original.<ext>
    const expectedPattern = new RegExp(
      `^media/${assetId}/original\\.(jpg|png|webp|avif)$`,
      "i",
    );
    if (
      !storagePath ||
      !expectedPattern.test(storagePath) ||
      storagePath.includes("..")
    ) {
      throw new MediaValidationError(
        `Invalid storage path: must strictly match media/${assetId}/original.<ext>.`,
      );
    }

    const pathExtMatch = storagePath.match(/\.(jpg|png|webp|avif)$/i);
    const pathExt = pathExtMatch ? pathExtMatch[1].toLowerCase() : "";
    const pathExtMime = EXT_TO_MIME[pathExt];
    if (!pathExtMime) {
      throw new MediaValidationError(
        "Invalid storage path: extension must be jpg, png, webp, or avif.",
      );
    }

    // Idempotency guard: If this asset is already finalized, return it cleanly
    const existingAsset = await query<DbMediaAsset>(
      `SELECT * FROM public.media_assets
       WHERE storage_provider = 'supabase' AND storage_path = $1;`,
      [storagePath],
    );
    if (existingAsset.rows.length > 0) {
      return {
        success: true,
        asset: existingAsset.rows[0],
      };
    }

    // 2. Download uploaded bytes server-side for verification
    let buffer: Buffer;
    try {
      buffer = await downloadStorageObject(storagePath);
    } catch (downloadErr) {
      console.error(
        "[admin-media-library] Storage retrieval failure:",
        downloadErr,
      );
      await deleteStorageObjects([storagePath]).catch(() => {});
      throw new MediaValidationError(
        "Uploaded image could not be retrieved from storage. Please retry the upload.",
      );
    }

    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      await deleteStorageObjects([storagePath]);
      throw new MediaValidationError(
        "Uploaded file exceeds the 10 MB limit or is empty.",
      );
    }

    // 3. Validate with Sharp
    let metadata: SharpMetadata;
    let dominantHex = "#f5f5f5";
    let lqip: string | null = null;
    let decodedMime: string;
    let contentSha256: string;

    try {
      const image = sharp(buffer, {
        failOn: "error",
        limitInputPixels: 268402689,
      });
      metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error("Invalid or unreadable image format.");
      }

      const format = metadata.format.toLowerCase();
      decodedMime = SHARP_FORMAT_TO_MIME[format];
      if (!decodedMime) {
        throw new Error(`Unsupported image format '${metadata.format}'.`);
      }

      // Finalize invariant: extension MIME == decoded Sharp MIME == declared MIME
      if (pathExtMime !== decodedMime) {
        throw new Error(
          `MIME type mismatch: storage path extension implies '${pathExtMime}', but decoded image is '${decodedMime}'.`,
        );
      }

      if (input.mimeType) {
        const declaredMime = input.mimeType.toLowerCase().trim();
        if (declaredMime !== decodedMime) {
          throw new Error(
            `MIME type mismatch: declared '${declaredMime}' but decoded bytes are '${decodedMime}'.`,
          );
        }
      }

      // Compute dominant color
      try {
        const stats = await image.stats();
        const d = stats.dominant;
        dominantHex = `#${((1 << 24) + (d.r << 16) + (d.g << 8) + d.b).toString(16).slice(1)}`;
      } catch {}

      // Compute LQIP WebP
      try {
        const lqipBuffer = await image
          .resize(16, 16, { fit: "inside" })
          .webp({ quality: 20 })
          .toBuffer();
        lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;
      } catch {}

      // Compute cryptographic integrity hash
      contentSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    } catch (validationErr) {
      // Best-effort cleanup of invalid storage blob
      await deleteStorageObjects([storagePath]);
      throw new MediaValidationError(
        `Image validation failed: ${validationErr instanceof Error ? validationErr.message : "Malformed image"}`,
      );
    }

    // 4. Persist to public.media_assets (does NOT attach to any product)
    try {
      const created = await createMediaAsset({
        id: assetId,
        storageProvider: "supabase",
        storagePath,
        originalFilename: sanitizeFilename(
          input.originalFilename || path.basename(storagePath),
        ),
        mimeType: decodedMime,
        fileSizeBytes: buffer.length,
        width: metadata.width,
        height: metadata.height,
        dominantColor: dominantHex,
        lqip,
        processedVariants: null,
        contentSha256,
      });

      return {
        success: true,
        asset: created,
      };
    } catch (dbErr) {
      // Clean up storage object if DB insert failed
      await deleteStorageObjects([storagePath]);
      console.error(
        "[admin-media-library] Database persistence failure:",
        dbErr,
      );
      throw dbErr;
    }
  } catch (err) {
    return handleMediaActionError(err);
  }
}

// ----------------------------------------------------------------------------
// 3. Product Media Placement Actions
// ----------------------------------------------------------------------------

export interface SimpleActionResult {
  success: boolean;
  error?: string;
}

/**
 * Attaches a global media asset to a product placement.
 * Guards against attaching legacy_public rollback assets.
 * Invalidates public catalog cache on success.
 */
export async function attachMediaAssetToProductAction(
  productId: string,
  mediaAssetId: string,
  options?: { isHero?: boolean; altText?: string },
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!mediaAssetId || !UUID_REGEX.test(mediaAssetId)) {
      throw new MediaValidationError(
        "Valid media asset ID (UUID) is required.",
      );
    }

    const asset = await getMediaAsset(mediaAssetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }
    if (asset.storage_provider === "legacy_public") {
      throw new MediaDomainError(
        "Legacy rollback assets cannot be newly attached to products.",
      );
    }

    await attachMediaToProduct({
      productId,
      mediaAssetId,
      isHero: options?.isHero,
      altText: options?.altText,
    });

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Attaches multiple global media assets to a product in a single atomic database transaction.
 * All-or-nothing: any failure rolls back all attachments in the batch.
 * Rejects duplicates, missing assets, and legacy_public assets before mutation.
 * Invalidates public catalog cache once, strictly after successful transaction commit.
 */
export async function attachMediaAssetsToProductAction(
  productId: string,
  mediaAssetIds: string[],
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!Array.isArray(mediaAssetIds) || mediaAssetIds.length === 0) {
      throw new MediaValidationError("At least one media asset ID is required.");
    }

    // Validate UUIDs and reject duplicate asset IDs before mutation
    for (const id of mediaAssetIds) {
      if (!id || !UUID_REGEX.test(id)) {
        throw new MediaValidationError(`Invalid media asset UUID '${id}'.`);
      }
    }
    const uniqueIds = new Set(mediaAssetIds);
    if (uniqueIds.size !== mediaAssetIds.length) {
      throw new MediaValidationError(
        "Duplicate media asset IDs in batch attachment are not allowed.",
      );
    }

    // Execute all attachments atomically in one database transaction
    await transaction(async (client) => {
      // 1. Verify target product exists
      const prodCheck = await client.query<{ id: string }>(
        `SELECT id FROM public.products WHERE id = $1;`,
        [productId],
      );
      if (prodCheck.rows.length === 0) {
        throw new MediaValidationError(`Product '${productId}' not found.`);
      }

      // 2. Fetch and validate all requested media assets
      const assetRes = await client.query<{ id: string; storage_provider: string }>(
        `SELECT id, storage_provider FROM public.media_assets WHERE id = ANY($1);`,
        [mediaAssetIds],
      );

      if (assetRes.rows.length !== mediaAssetIds.length) {
        const found = new Set(assetRes.rows.map((r) => r.id));
        const missing = mediaAssetIds.filter((id) => !found.has(id));
        throw new MediaValidationError(
          `Media asset(s) not found: ${missing.join(", ")}`,
        );
      }

      const legacyAssets = assetRes.rows.filter(
        (r) => r.storage_provider === "legacy_public",
      );
      if (legacyAssets.length > 0) {
        throw new MediaDomainError(
          "Legacy rollback assets cannot be newly attached to products.",
        );
      }

      // 3. Perform every product_media attachment sequentially using the same transaction client
      for (const id of mediaAssetIds) {
        await attachMediaToProduct(
          {
            productId,
            mediaAssetId: id,
          },
          client,
        );
      }
    });

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Detaches a media asset from a product placement.
 * Server-side guard: active products cannot detach their final managed non-legacy media asset.
 * Promotes next available managed image if detached item was hero.
 * Underlying global media_assets record remains intact.
 * Invalidates public catalog cache on success.
 */
export async function detachMediaAssetFromProductAction(
  productId: string,
  mediaAssetId: string,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!mediaAssetId || !UUID_REGEX.test(mediaAssetId)) {
      throw new MediaValidationError(
        "Valid media asset ID (UUID) is required.",
      );
    }

    // Check product status
    const prodRes = await query<{ status: string }>(
      `SELECT status FROM public.products WHERE id = $1;`,
      [productId],
    );
    if (prodRes.rows.length === 0) {
      throw new MediaValidationError(`Product '${productId}' not found.`);
    }
    const productStatus = prodRes.rows[0].status;

    // Check asset metadata
    const asset = await getMediaAsset(mediaAssetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }
    if (asset.storage_provider === "legacy_public") {
      throw new MediaDomainError(
        "Legacy rollback assets are read-only during the rollback window.",
      );
    }

    // Active product last-media safety invariant
    if (productStatus === "active") {
      const managedCountRes = await query<{ count: string }>(
        `SELECT COUNT(*)::int AS count
         FROM public.product_media pm
         JOIN public.media_assets ma ON ma.id = pm.media_asset_id
         WHERE pm.product_id = $1 AND ma.storage_provider != 'legacy_public';`,
        [productId],
      );
      const managedCount = Number(managedCountRes.rows[0]?.count || 0);
      if (managedCount <= 1) {
        throw new MediaDomainError(
          "Active products must retain at least one managed image. Attach a replacement before removing this asset.",
        );
      }
    }

    await detachMediaFromProduct(productId, mediaAssetId);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Atomically promotes a product's attached media asset to hero.
 * Rejects legacy_public rollback assets.
 * Invalidates public catalog cache on success.
 */
export async function setProductMediaHeroAction(
  productId: string,
  mediaAssetId: string,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!mediaAssetId || !UUID_REGEX.test(mediaAssetId)) {
      throw new MediaValidationError(
        "Valid media asset ID (UUID) is required.",
      );
    }

    const asset = await getMediaAsset(mediaAssetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }
    if (asset.storage_provider === "legacy_public") {
      throw new MediaDomainError("Legacy rollback assets cannot be set as hero.");
    }

    await setProductHeroMedia(productId, mediaAssetId);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Reorders product media associations deterministically.
 * Server wrapper: validates the non-legacy managed set, assigns them positions 0..N-1,
 * and preserves any hidden legacy rollback assets positioned after them in their existing relative order.
 * Strictly managed-only: rejects missing IDs, extra IDs, duplicates, or any legacy ID.
 * Invalidates public catalog cache on success.
 */
export async function reorderProductMediaActionV1(
  productId: string,
  mediaAssetIds: string[],
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!Array.isArray(mediaAssetIds) || mediaAssetIds.length === 0) {
      throw new MediaValidationError("Non-empty media asset IDs array is required.");
    }
    for (const id of mediaAssetIds) {
      if (!id || !UUID_REGEX.test(id)) {
        throw new MediaValidationError(`Invalid media asset UUID '${id}'.`);
      }
    }

    // Reject duplicates before mutation
    const uniqueSubmitted = new Set(mediaAssetIds);
    if (uniqueSubmitted.size !== mediaAssetIds.length) {
      throw new MediaValidationError(
        "Duplicate media asset IDs in reorder are not allowed.",
      );
    }

    // Fetch existing product_media associations with storage providers
    const existingRes = await query<{ media_asset_id: string; storage_provider: string }>(
      `SELECT pm.media_asset_id, ma.storage_provider
       FROM public.product_media pm
       JOIN public.media_assets ma ON ma.id = pm.media_asset_id
       WHERE pm.product_id = $1
       ORDER BY pm.position ASC, pm.created_at ASC;`,
      [productId],
    );

    const managedIds = existingRes.rows
      .filter((r) => r.storage_provider !== "legacy_public")
      .map((r) => r.media_asset_id);
    const legacyIds = existingRes.rows
      .filter((r) => r.storage_provider === "legacy_public")
      .map((r) => r.media_asset_id);

    // Reject any legacy_public ID supplied by caller
    const legacyIdSet = new Set(legacyIds);
    for (const id of mediaAssetIds) {
      if (legacyIdSet.has(id)) {
        throw new MediaDomainError(
          "Legacy rollback assets cannot be reordered.",
        );
      }
    }

    const managedIdSet = new Set(managedIds);

    // Verify submitted set == managed set exactly
    // Reject unknown extra IDs
    for (const id of mediaAssetIds) {
      if (!managedIdSet.has(id)) {
        throw new MediaValidationError(
          `Extra media asset ID '${id}' is not a managed asset of this product.`,
        );
      }
    }

    // Reject missing / omitted managed IDs
    if (mediaAssetIds.length !== managedIds.length) {
      throw new MediaValidationError(
        "Submitted media IDs must contain all current managed media assets.",
      );
    }

    // Full persisted order = submitted managed IDs + existing legacy IDs in their existing relative order
    const fullOrder = [...mediaAssetIds, ...legacyIds];

    await reorderProductMediaV1(productId, fullOrder);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Updates placement-level alt text on product_media.
 * Legacy rollback assets are read-only and cannot be mutated.
 * Invalidates public catalog cache on success.
 */
export async function updateProductMediaAltTextActionV1(
  productId: string,
  mediaAssetId: string,
  altText: string | null,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!mediaAssetId || !UUID_REGEX.test(mediaAssetId)) {
      throw new MediaValidationError(
        "Valid media asset ID (UUID) is required.",
      );
    }

    const asset = await getMediaAsset(mediaAssetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }
    if (asset.storage_provider === "legacy_public") {
      throw new MediaDomainError(
        "Legacy rollback assets are read-only during the rollback window.",
      );
    }

    await updateProductMediaAltTextV1(productId, mediaAssetId, altText);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

export interface ListMediaLibraryAssetsActionParams {
  q?: string;
  sort?: "created_desc" | "created_asc" | "size_desc" | "size_asc";
  page?: number;
  limit?: number;
}

export interface ListMediaLibraryAssetsActionResult {
  success: boolean;
  data?: ListMediaLibraryAssetsResult;
  error?: string;
}

/**
 * Authenticated Server Action for the Product Media Library Picker.
 * Exclusively queries active 'supabase' assets (never legacy_public).
 */
export async function listMediaLibraryAssetsAction(
  params?: ListMediaLibraryAssetsActionParams,
): Promise<ListMediaLibraryAssetsActionResult> {
  try {
    await requireAdmin();
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(Math.max(1, params?.limit ?? 12), 48);
    const offset = (page - 1) * limit;

    const result = await listMediaLibraryAssets({
      query: params?.q,
      provider: "supabase", // Enforce Supabase only (no legacy_public)
      sort: params?.sort || "created_desc",
      limit,
      offset,
    });

    return { success: true, data: result };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

export interface GetProductMediaV1ActionResult {
  success: boolean;
  media?: AdminProductMediaPlacement[];
  error?: string;
}

/**
 * Retrieves current product media placements with resolved CDN URLs.
 * Enables in-place media updates without triggering full page reloads.
 */
export async function getProductMediaV1Action(
  productId: string,
): Promise<GetProductMediaV1ActionResult> {
  try {
    await requireAdmin();
    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    const rows = await listProductMediaV1(productId);
    const media: AdminProductMediaPlacement[] = rows.map((m) => ({
      id: m.id,
      productId: m.product_id,
      mediaAssetId: m.media_asset_id,
      position: m.position,
      isHero: m.is_hero,
      altText: m.alt_text,
      asset: {
        id: m.asset.id,
        provider: m.asset.storage_provider,
        storagePath: m.asset.storage_path,
        publicUrl: getStoragePublicUrl(m.asset.storage_path),
        filename: m.asset.original_filename,
        width: m.asset.width,
        height: m.asset.height,
        fileSize: m.asset.file_size_bytes,
        dominantColor: m.asset.dominant_color,
        lqip: m.asset.lqip,
      },
    }));
    return { success: true, media };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

// ----------------------------------------------------------------------------
// 4. Safe Asset Deletion Action
// ----------------------------------------------------------------------------

export interface DeleteMediaLibraryAssetResult {
  success: boolean;
  warning?: string;
  error?: string;
}

/**
 * Deletes an unattached global Media Library asset.
 * Rejects deletion if asset is attached to any products (usage_count > 0).
 * Rejects deletion of legacy_public assets (read-only during rollback window).
 * Executes DB delete first (FK protected), then cleans up Supabase Storage.
 * Returns structured warning if Storage cleanup fails after DB removal.
 */
export async function deleteMediaLibraryAssetAction(
  assetId: string,
): Promise<DeleteMediaLibraryAssetResult> {
  try {
    await requireAdmin();

    if (!assetId || !UUID_REGEX.test(assetId)) {
      throw new MediaValidationError("Valid asset ID (UUID) is required.");
    }

    // 1. Fetch asset metadata
    const asset = await getMediaAsset(assetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }

    // 2. Guard legacy assets
    if (asset.storage_provider === "legacy_public") {
      throw new MediaDomainError(
        "Legacy assets are read-only during the rollback window and cannot be deleted.",
      );
    }

    // 3. Guard in-use assets
    const usage = await getMediaAssetUsage(assetId);
    if (usage.usageCount > 0) {
      throw new MediaDomainError(
        `Cannot delete media asset '${assetId}': It is currently attached to ${usage.usageCount} product(s). Detach it from all products first.`,
      );
    }

    // 4. DB delete first, protected by foreign key constraints
    await deleteMediaAsset(assetId);

    // 5. Clean up Storage object
    const storageRes = await deleteStorageObjects([asset.storage_path]);

    updateTag("catalog-public");

    if (!storageRes.success) {
      const msg = `[admin-media-library] Storage cleanup warning: Asset record '${assetId}' was deleted from database, but storage cleanup failed for path '${asset.storage_path}'.`;
      console.warn(msg);
      return {
        success: true,
        warning:
          "Media asset record deleted from database, but storage cleanup encountered an error. Physical storage object may require manual removal.",
      };
    }

    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

export interface GetMediaLibraryAssetDetailResult {
  success: boolean;
  asset?: MediaLibraryAssetDetail | null;
  error?: string;
}

/**
 * Retrieves full details and live product usage breakdown for an asset.
 */
export async function getMediaLibraryAssetDetailAction(
  assetId: string,
): Promise<GetMediaLibraryAssetDetailResult> {
  try {
    await requireAdmin();

    if (!assetId || !UUID_REGEX.test(assetId)) {
      throw new MediaValidationError("Valid asset ID (UUID) is required.");
    }

    const asset = await getMediaLibraryAsset(assetId);
    if (!asset) {
      throw new MediaValidationError("Media asset not found.");
    }

    return { success: true, asset };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

