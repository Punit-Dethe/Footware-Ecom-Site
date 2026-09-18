"use server";

import crypto from "node:crypto";
import path from "node:path";
import { updateTag } from "next/cache";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { AdminAuthError, requireAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import {
  attachMediaToProduct,
  createMediaAsset,
  deleteMediaAsset,
  detachMediaFromProduct,
  getMediaAsset,
  getMediaAssetUsage,
  reorderProductMediaV1,
  setProductHeroMedia,
  updateProductMediaAltTextV1,
  type DbMediaAsset,
} from "@/lib/db/media-v1";
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
 * Detaches a media asset from a product placement.
 * Promotes next available image if detached item was hero.
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

    await detachMediaFromProduct(productId, mediaAssetId);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Atomically promotes a product's attached media asset to hero.
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

    await setProductHeroMedia(productId, mediaAssetId);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Reorders product media associations deterministically.
 * Enforces exact set equality and no duplicates.
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

    await reorderProductMediaV1(productId, mediaAssetIds);

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Updates placement-level alt text on product_media.
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

    await updateProductMediaAltTextV1(productId, mediaAssetId, altText);

    updateTag("catalog-public");
    return { success: true };
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
