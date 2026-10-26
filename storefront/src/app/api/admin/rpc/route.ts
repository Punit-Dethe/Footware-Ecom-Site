import { NextResponse } from "next/server";
import * as catalog from "@/lib/actions/admin-catalog";
import * as media from "@/lib/actions/admin-media-library";

/**
 * JSON transport for admin dashboard operations.
 *
 * The admin UI calls this instead of invoking Server Actions directly.
 * In production the Server Action response path fails with an opaque
 * "An error occurred in the Server Components render" / network error, while
 * a plain Route Handler returns a normal JSON body.
 *
 * Only the allow-listed functions below can be called. Every one of them
 * enforces requireAdmin() itself, so this route adds no new privileges.
 */
const HANDLERS = {
  // Catalog
  archiveProductAction: catalog.archiveProductAction,
  restoreProductAction: catalog.restoreProductAction,
  createCategoryAction: catalog.createCategoryAction,
  updateCategoryAction: catalog.updateCategoryAction,
  deleteCategoryAction: catalog.deleteCategoryAction,
  revalidatePublicCatalogAction: catalog.revalidatePublicCatalogAction,
  // Media
  requestMediaLibraryUploadAction: media.requestMediaLibraryUploadAction,
  finalizeMediaLibraryUploadAction: media.finalizeMediaLibraryUploadAction,
  attachMediaAssetToProductAction: media.attachMediaAssetToProductAction,
  attachMediaAssetsToProductAction: media.attachMediaAssetsToProductAction,
  detachMediaAssetFromProductAction: media.detachMediaAssetFromProductAction,
  setProductMediaHeroAction: media.setProductMediaHeroAction,
  reorderProductMediaActionV1: media.reorderProductMediaActionV1,
  updateProductMediaAltTextActionV1: media.updateProductMediaAltTextActionV1,
  listMediaLibraryAssetsAction: media.listMediaLibraryAssetsAction,
  getProductMediaV1Action: media.getProductMediaV1Action,
  deleteMediaLibraryAssetAction: media.deleteMediaLibraryAssetAction,
  getMediaLibraryAssetDetailAction: media.getMediaLibraryAssetDetailAction,
} as const;

type AdminRpcName = keyof typeof HANDLERS;

const MAX_ARGS = 5;

export async function POST(request: Request) {
  let body: { action?: unknown; args?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.action === "string" ? body.action : "";
  if (!Object.prototype.hasOwnProperty.call(HANDLERS, name)) {
    return NextResponse.json({ success: false, error: "Unknown admin operation." }, { status: 404 });
  }

  const args = Array.isArray(body.args) ? body.args : [];
  if (args.length > MAX_ARGS) {
    return NextResponse.json({ success: false, error: "Too many arguments." }, { status: 400 });
  }

  try {
    const fn = HANDLERS[name as AdminRpcName] as (...a: unknown[]) => Promise<unknown>;
    const result = await fn(...args);
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    console.error(`[api/admin/rpc] ${name} failed:`, err);
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected server error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}
