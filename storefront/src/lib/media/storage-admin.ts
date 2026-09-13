import "server-only";

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const PRODUCT_MEDIA_BUCKET = "product-media";

/**
 * Returns a server-only Supabase admin client configured with the service role key.
 * Never logs credentials. Fails closed if credentials are not configured.
 */
export function getStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Storage admin error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
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

/**
 * Deletes one or more storage objects best-effort.
 */
export async function deleteStorageObjects(
  storagePaths: string[],
): Promise<void> {
  if (!storagePaths || storagePaths.length === 0) return;
  const supabase = getStorageAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .remove(storagePaths);

  if (error) {
    console.error(
      `[storage-admin] Failed to delete storage objects: ${error.message}. Paths:`,
      storagePaths,
    );
  }
}
