import "server-only";

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const PRODUCT_MEDIA_BUCKET = "product-media";

/**
 * Returns a server-only Supabase admin client configured with SUPABASE_SECRET_KEY.
 * Never logs credentials. Fails closed if credentials are not configured.
 */
export function getStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Storage admin error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is not configured.",
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Generates a collision-resistant unique storage path for a product media item.
 * Format: products/<product-id>/<media-id>/original.<ext>
 */
export function generateMediaStoragePath(
  productId: string,
  ext: string,
  mediaId: string = crypto.randomUUID(),
): { mediaId: string; storagePath: string } {
  const cleanExt = ext.replace(/^\./, "").toLowerCase() || "webp";
  const storagePath = `products/${productId}/${mediaId}/original.${cleanExt}`;
  return { mediaId, storagePath };
}

/**
 * Creates a signed upload URL permitting the client to upload directly to an exact object path.
 * Expires in 15 minutes (900 seconds).
 */
export async function createSignedMediaUploadUrl(
  storagePath: string,
): Promise<{ signedUrl: string; token: string; path: string }> {
  const supabase = getStorageAdminClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to create signed upload URL for path '${storagePath}': ${error?.message || "unknown error"}`,
    );
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

/**
 * Downloads the bytes of an uploaded storage object for server-side validation.
 */
export async function downloadStorageObject(
  storagePath: string,
): Promise<Buffer> {
  const supabase = getStorageAdminClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(
      `Failed to download storage object '${storagePath}': ${error?.message || "unknown error"}`,
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface DeleteStorageObjectsResult {
  success: boolean;
  failedPaths?: string[];
  error?: string;
}

/**
 * Deletes one or more storage objects.
 * Returns a structured result so callers can distinguish DB mutation success
 * from Storage cleanup failure.
 */
export async function deleteStorageObjects(
  storagePaths: string[],
): Promise<DeleteStorageObjectsResult> {
  if (!storagePaths || storagePaths.length === 0) {
    return { success: true };
  }

  const uniquePaths = Array.from(new Set(storagePaths.filter(Boolean)));
  if (uniquePaths.length === 0) {
    return { success: true };
  }

  try {
    const supabase = getStorageAdminClient();
    const { error } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .remove(uniquePaths);

    if (error) {
      console.error(
        `[storage-admin] Failed to delete storage objects: ${error.message}. Paths:`,
        uniquePaths,
      );
      return {
        success: false,
        failedPaths: uniquePaths,
        error: error.message,
      };
    }

    return { success: true };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unknown storage deletion error";
    console.error(
      `[storage-admin] Exception during storage object deletion: ${msg}. Paths:`,
      uniquePaths,
    );
    return {
      success: false,
      failedPaths: uniquePaths,
      error: msg,
    };
  }
}

/**
 * Uploads a buffer directly to Supabase Storage with optional upsert.
 */
export async function uploadStorageObject(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  upsert = true,
): Promise<void> {
  const supabase = getStorageAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert,
    });

  if (error) {
    throw new Error(
      `Failed to upload storage object to '${storagePath}': ${error.message}`,
    );
  }
}

/**
 * Verifies existence of a storage object by checking its presence in its parent folder.
 */
export async function checkStorageObjectExists(
  storagePath: string,
): Promise<boolean> {
  try {
    const supabase = getStorageAdminClient();
    const slashIdx = storagePath.lastIndexOf("/");
    const folder = slashIdx !== -1 ? storagePath.substring(0, slashIdx) : "";
    const filename =
      slashIdx !== -1 ? storagePath.substring(slashIdx + 1) : storagePath;

    const { data, error } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .list(folder, { search: filename });

    if (error || !data) return false;
    return data.some((item) => item.name === filename);
  } catch {
    return false;
  }
}
