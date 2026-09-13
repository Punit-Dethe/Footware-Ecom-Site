"use server";

import { updateTag } from "next/cache";
import path from "node:path";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createSignedMediaUploadUrl,
  deleteStorageObjects,
  downloadStorageObject,
  generateMediaStoragePath,
} from "@/lib/media/storage-admin";
import {
  deleteProductMedia,
  insertProductMedia,
  reorderProductMedia,
  setHeroMediaAtomic,
  updateMediaAltText,
} from "@/lib/db/media";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

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
 */
export async function requestProductMediaUploadAction(
  productId: string,
  filename: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<RequestUploadResult> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Valid product ID is required." };
    }

    const cleanMime = mimeType?.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      return {
        success: false,
        error: `Disallowed image type '${mimeType}'. Allowed formats: JPEG, PNG, WebP, AVIF. SVG is not allowed.`,
      };
    }

    if (fileSizeBytes > MAX_UPLOAD_BYTES) {
      return {
        success: false,
        error: `File size exceeds the 10 MB limit (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB).`,
      };
    }

    const ext = path.extname(filename || "").slice(1).toLowerCase() || "webp";
    if (ext === "svg") {
      return { success: false, error: "SVG images are not allowed." };
    }

    const { mediaId, storagePath } = generateMediaStoragePath(productId, ext);
    const { signedUrl, token } = await createSignedMediaUploadUrl(storagePath);

    return {
      success: true,
      signedUrl,
      token,
      storagePath,
      mediaId,
    };
  } catch (err) {
    console.error("[admin-media] request upload error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to authorize media upload.",
    };
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
 * Deletes uploaded object best-effort if verification fails.
 */
export async function finalizeProductMediaUploadAction(
  input: FinalizeUploadInput,
): Promise<FinalizeUploadResult> {
  try {
    await requireAdmin();

    // 1. Download uploaded bytes server-side for validation
    let buffer: Buffer;
    try {
      buffer = await downloadStorageObject(input.storagePath);
    } catch (downloadErr) {
      return {
        success: false,
        error: `Failed to retrieve uploaded image from storage: ${downloadErr instanceof Error ? downloadErr.message : "Not found"}`,
      };
    }

    if (buffer.length > MAX_UPLOAD_BYTES) {
      await deleteStorageObjects([input.storagePath]);
      return { success: false, error: "Uploaded file exceeds the 10 MB size limit." };
    }

    // 2. Validate with Sharp
    let metadata: SharpMetadata;
    let dominantHex = "#f5f5f5";
    let lqip: string | null = null;

    try {
      const image = sharp(buffer);
      metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error("Invalid or unreadable image format.");
      }

      // Check format
      const validFormats = ["jpeg", "png", "webp", "avif"];
      if (!validFormats.includes(metadata.format.toLowerCase())) {
        throw new Error(`Unsupported image format '${metadata.format}'.`);
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
      await deleteStorageObjects([input.storagePath]);
      return {
        success: false,
        error: `Image validation failed: ${validationErr instanceof Error ? validationErr.message : "Malformed image"}`,
      };
    }

    // 3. Persist to PostgreSQL product_images
    try {
      await insertProductMedia({
        id: input.mediaId,
        productId: input.productId,
        storagePath: input.storagePath,
        altText: input.altText || null,
        width: metadata.width || null,
        height: metadata.height || null,
        dominantColor: dominantHex,
        lqip,
        originalFilename: input.originalFilename || null,
        mimeType: input.mimeType || `image/${metadata.format}`,
        fileSizeBytes: buffer.length,
      });
    } catch (dbErr) {
      // Database insert failed, clean up uploaded storage object
      await deleteStorageObjects([input.storagePath]);
      throw dbErr;
    }

    // 4. Invalidate public catalog cache
    updateTag("catalog-public");

    return { success: true, mediaId: input.mediaId };
  } catch (err) {
    console.error("[admin-media] finalize upload error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to finalize media upload.",
    };
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
    await setHeroMediaAtomic(productId, mediaId);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    console.error("[admin-media] set hero error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to set hero image.",
    };
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
    await reorderProductMedia(productId, mediaIds);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    console.error("[admin-media] reorder error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder media.",
    };
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
    await updateMediaAltText(productId, mediaId, altText);
    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    console.error("[admin-media] update alt text error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update alt text.",
    };
  }
}

/**
 * Deletes a product image. Deletes from DB first, promotes next hero if needed,
 * then cleans up storage objects best-effort.
 */
export async function deleteProductMediaAction(
  productId: string,
  mediaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const result = await deleteProductMedia(productId, mediaId);

    // Clean up storage objects best-effort
    if (result.storagePathsToDelete.length > 0) {
      deleteStorageObjects(result.storagePathsToDelete).catch((err) => {
        console.error("[admin-media] Background storage cleanup warning:", err);
      });
    }

    updateTag("catalog-public");
    return { success: true };
  } catch (err) {
    console.error("[admin-media] delete error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete image.",
    };
  }
}
