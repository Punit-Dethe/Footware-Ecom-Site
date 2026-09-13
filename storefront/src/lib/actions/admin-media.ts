"use server";

import { updateTag } from "next/cache";
import crypto from "node:crypto";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { AdminAuthError, requireAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import {
  createSignedMediaUploadUrl,
  deleteStorageObjects,
  downloadStorageObject,
} from "@/lib/media/storage-admin";
import {
  deleteProductMedia,
  insertProductMedia,
  reorderProductMedia,
  setHeroMediaAtomic,
  updateMediaAltText,
} from "@/lib/db/media";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

function handleMediaActionError(err: any): { success: false; error: string } {
  if (
    err instanceof AdminAuthError ||
    err?.name === "AdminAuthError" ||
    err?.message?.includes("Admin authorization required") ||
    err?.message?.includes("Unauthorized")
  ) {
    if (err.code === "INFRASTRUCTURE_ERROR") {
      console.error("[admin-media] Auth infrastructure error:", err);
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
    err?.name === "MediaValidationError"
  ) {
    return {
      success: false,
      error: err.message,
    };
  }

  // Preserve user-fixable validation error messages
  const userFixableKeywords = [
    "does not exist",
    "does not belong",
    "not belong",
    "Disallowed image type",
    "exceeds the 10 MB limit",
    "SVG images are not allowed",
    "contain duplicates",
    "count does not match",
    "Invalid product ID",
    "Invalid media ID",
    "Invalid image type",
    "Image validation failed",
    "Unsupported image format",
    "Invalid storage path",
    "MIME type mismatch",
    "File size must be a positive integer",
  ];

  const msg = err instanceof Error ? err.message : String(err);
  for (const kw of userFixableKeywords) {
    if (msg.includes(kw)) {
      return {
        success: false,
        error: msg,
      };
    }
  }

  // Log unexpected database / storage / network error server-side
  console.error("[admin-media] Internal error:", err);

  return {
    success: false,
    error: "An unexpected system error occurred. Media changes were not saved.",
  };
}

export interface RequestUploadResult {
  success: boolean;
  signedUrl?: string;
  token?: string;
  storagePath?: string;
  mediaId?: string;
  error?: string;
}

/**
 * Step 1: Admin requests upload authorization.
 * Generates an exact, collision-resistant object path and signed upload token.
 * Validates product existence, file size, and allowed MIME whitelisting.
 */
export async function requestProductMediaUploadAction(
  productId: string,
  filename: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<RequestUploadResult> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string" || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }

    // Verify target product exists in PostgreSQL
    const prodRes = await query<{ id: string }>(
      "SELECT id FROM public.products WHERE id = $1;",
      [productId],
    );
    if (prodRes.rows.length === 0) {
      throw new MediaValidationError(`Product '${productId}' does not exist.`);
    }

    if (
      typeof fileSizeBytes !== "number" ||
      !Number.isFinite(fileSizeBytes) ||
      !Number.isInteger(fileSizeBytes) ||
      fileSizeBytes <= 0
    ) {
      throw new MediaValidationError("File size must be a positive integer.");
    }

    if (fileSizeBytes > MAX_UPLOAD_BYTES) {
      throw new MediaValidationError(
        `File size exceeds the 10 MB limit (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB).`,
      );
    }

    const cleanMime = mimeType?.toLowerCase().trim();
    if (!cleanMime || !MIME_TO_EXT[cleanMime]) {
      if (
        cleanMime === "image/svg+xml" ||
        filename?.toLowerCase().endsWith(".svg")
      ) {
        throw new MediaValidationError("SVG images are not allowed.");
      }
      throw new MediaValidationError(
        `Disallowed image type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, AVIF. SVG is not allowed.`,
      );
    }

    const ext = MIME_TO_EXT[cleanMime];
    const mediaId = crypto.randomUUID();
    const storagePath = `products/${productId}/${mediaId}/original.${ext}`;

    const { signedUrl, token } = await createSignedMediaUploadUrl(storagePath);

    return {
      success: true,
      signedUrl,
      token,
      storagePath,
      mediaId,
    };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

export interface FinalizeUploadInput {
  productId: string;
  mediaId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  altText?: string;
}

export interface FinalizeUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Step 2: Finalize upload after direct client upload.
 * Downloads the object server-side and validates with Sharp (ensures actual image, dimensions, LQIP, dominant color).
 * Strictly validates storagePath against the bound product/media namespace.
 * Deletes uploaded object best-effort if verification fails.
 */
export async function finalizeProductMediaUploadAction(
  input: FinalizeUploadInput,
): Promise<FinalizeUploadResult> {
  const { productId, mediaId, storagePath } = input;

  try {
    await requireAdmin();

    // 1. Untrusted input validation
    if (!productId || !UUID_REGEX.test(productId)) {
      throw new MediaValidationError("Valid product ID (UUID) is required.");
    }
    if (!mediaId || !UUID_REGEX.test(mediaId)) {
      throw new MediaValidationError("Valid media ID (UUID) is required.");
    }

    // Path must strictly bind to namespace: products/<productId>/<mediaId>/original.<ext>
    const expectedPattern = new RegExp(
      `^products/${productId}/${mediaId}/original\\.(jpg|png|webp|avif)$`,
    );
    if (!storagePath || !expectedPattern.test(storagePath) || storagePath.includes("..")) {
      throw new MediaValidationError(
        "Invalid storage path: must strictly match products/<productId>/<mediaId>/original.<ext>.",
      );
    }

    // Verify product exists in PostgreSQL
    const prodRes = await query<{ id: string }>(
      "SELECT id FROM public.products WHERE id = $1;",
      [productId],
    );
    if (prodRes.rows.length === 0) {
      throw new MediaValidationError(`Product '${productId}' does not exist.`);
    }

    // 2. Download uploaded bytes server-side for validation
    let buffer: Buffer;
    try {
      buffer = await downloadStorageObject(storagePath);
    } catch (downloadErr) {
      throw new MediaValidationError(
        `Failed to retrieve uploaded image from storage: ${downloadErr instanceof Error ? downloadErr.message : "Not found"}`,
      );
    }

    if (buffer.length > MAX_UPLOAD_BYTES || buffer.length === 0) {
      await deleteStorageObjects([storagePath]);
      throw new MediaValidationError("Uploaded file exceeds the 10 MB limit.");
    }

    // 3. Validate with Sharp
    let metadata: SharpMetadata;
    let dominantHex = "#f5f5f5";
    let lqip: string | null = null;
    let decodedMime: string;

    try {
      const image = sharp(buffer, { failOn: "error", limitInputPixels: 268402689 });
      metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error("Invalid or unreadable image format.");
      }

      const format = metadata.format.toLowerCase();
      decodedMime = SHARP_FORMAT_TO_MIME[format];
      if (!decodedMime) {
        throw new Error(`Unsupported image format '${metadata.format}'.`);
      }

      // Verify declared MIME matches actual decoded MIME
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
    } catch (validationErr) {
      // Clean up invalid object best-effort
      await deleteStorageObjects([storagePath]);
      throw new MediaValidationError(
        `Image validation failed: ${validationErr instanceof Error ? validationErr.message : "Malformed image"}`,
      );
    }

    // 4. Persist to PostgreSQL product_images
    try {
      await insertProductMedia({
        id: mediaId,
        productId,
        storagePath,
        altText: input.altText || null,
        width: metadata.width || null,
        height: metadata.height || null,
        dominantColor: dominantHex,
        lqip,
        originalFilename: input.originalFilename || null,
        mimeType: decodedMime,
        fileSizeBytes: buffer.length,
      });
    } catch (dbErr) {
      // Database insert failed, clean up uploaded storage object best-effort
      const cleanup = await deleteStorageObjects([storagePath]);
      if (!cleanup.success) {
        console.error(
          "[admin-media] Orphan cleanup required: storage object could not be deleted after DB failure:",
          storagePath,
        );
      }
      throw dbErr;
    }

    // 5. Invalidate public catalog cache
    updateTag("catalog-public");

    return { success: true, mediaId };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Sets a specific image as hero for the product.
 */
export async function setHeroMediaAction(
  productId: string,
  mediaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!UUID_REGEX.test(productId)) throw new MediaValidationError("Invalid product ID.");
    if (!UUID_REGEX.test(mediaId)) throw new MediaValidationError("Invalid media ID.");

    await setHeroMediaAtomic(productId, mediaId);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Reorders product media deterministically.
 */
export async function reorderProductMediaAction(
  productId: string,
  mediaIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!UUID_REGEX.test(productId)) throw new MediaValidationError("Invalid product ID.");
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new MediaValidationError("Media IDs must be a non-empty array.");
    }

    await reorderProductMedia(productId, mediaIds);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Updates alt text for a product image.
 */
export async function updateMediaAltTextAction(
  productId: string,
  mediaId: string,
  altText: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!UUID_REGEX.test(productId)) throw new MediaValidationError("Invalid product ID.");
    if (!UUID_REGEX.test(mediaId)) throw new MediaValidationError("Invalid media ID.");

    await updateMediaAltText(productId, mediaId, altText);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}

/**
 * Deletes a product image. Deletes from DB first, promotes next hero if needed,
 * then awaits storage cleanup.
 */
export async function deleteProductMediaAction(
  productId: string,
  mediaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!UUID_REGEX.test(productId)) throw new MediaValidationError("Invalid product ID.");
    if (!UUID_REGEX.test(mediaId)) throw new MediaValidationError("Invalid media ID.");

    // 1. Delete from PostgreSQL first inside transaction
    const result = await deleteProductMedia(productId, mediaId);

    // 2. Await Storage cleanup
    if (result.storagePathsToDelete.length > 0) {
      const cleanup = await deleteStorageObjects(result.storagePathsToDelete);
      if (!cleanup.success) {
        console.error(
          "[admin-media] Orphan cleanup required: Storage objects could not be deleted:",
          cleanup.failedPaths,
          cleanup.error,
        );
      }
    }

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    return handleMediaActionError(err);
  }
}
