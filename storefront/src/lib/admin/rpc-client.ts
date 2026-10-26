import type * as catalog from "@/lib/actions/admin-catalog";
import type * as media from "@/lib/actions/admin-media-library";

/**
 * Browser-side callers for /api/admin/rpc. Each export has the same name and
 * signature as the Server Action it replaces, so components only change their
 * import path. Calls resolve to the action's normal result object; a
 * non-JSON server reply becomes { success: false, error } with the HTTP status.
 */
async function callAdmin<T>(action: string, args: unknown[]): Promise<T> {
  const res = await fetch("/api/admin/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ action, args }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      success: false,
      error: `Server returned HTTP ${res.status}: ${text.slice(0, 200) || "empty response"}`,
    } as T;
  }
}

type Fn = (...args: any[]) => Promise<any>;
function bind<F extends Fn>(name: string): F {
  return ((...args: Parameters<F>) => callAdmin<Awaited<ReturnType<F>>>(name, args)) as F;
}

// Catalog
export const archiveProductAction = bind<typeof catalog.archiveProductAction>("archiveProductAction");
export const restoreProductAction = bind<typeof catalog.restoreProductAction>("restoreProductAction");
export const createCategoryAction = bind<typeof catalog.createCategoryAction>("createCategoryAction");
export const updateCategoryAction = bind<typeof catalog.updateCategoryAction>("updateCategoryAction");
export const deleteCategoryAction = bind<typeof catalog.deleteCategoryAction>("deleteCategoryAction");
export const revalidatePublicCatalogAction = bind<typeof catalog.revalidatePublicCatalogAction>(
  "revalidatePublicCatalogAction",
);

// Media
export const requestMediaLibraryUploadAction = bind<typeof media.requestMediaLibraryUploadAction>(
  "requestMediaLibraryUploadAction",
);
export const finalizeMediaLibraryUploadAction = bind<typeof media.finalizeMediaLibraryUploadAction>(
  "finalizeMediaLibraryUploadAction",
);
export const attachMediaAssetToProductAction = bind<typeof media.attachMediaAssetToProductAction>(
  "attachMediaAssetToProductAction",
);
export const attachMediaAssetsToProductAction = bind<typeof media.attachMediaAssetsToProductAction>(
  "attachMediaAssetsToProductAction",
);
export const detachMediaAssetFromProductAction = bind<typeof media.detachMediaAssetFromProductAction>(
  "detachMediaAssetFromProductAction",
);
export const setProductMediaHeroAction = bind<typeof media.setProductMediaHeroAction>(
  "setProductMediaHeroAction",
);
export const reorderProductMediaActionV1 = bind<typeof media.reorderProductMediaActionV1>(
  "reorderProductMediaActionV1",
);
export const updateProductMediaAltTextActionV1 = bind<typeof media.updateProductMediaAltTextActionV1>(
  "updateProductMediaAltTextActionV1",
);
export const listMediaLibraryAssetsAction = bind<typeof media.listMediaLibraryAssetsAction>(
  "listMediaLibraryAssetsAction",
);
export const getProductMediaV1Action = bind<typeof media.getProductMediaV1Action>(
  "getProductMediaV1Action",
);
export const deleteMediaLibraryAssetAction = bind<typeof media.deleteMediaLibraryAssetAction>(
  "deleteMediaLibraryAssetAction",
);
export const getMediaLibraryAssetDetailAction = bind<typeof media.getMediaLibraryAssetDetailAction>(
  "getMediaLibraryAssetDetailAction",
);
