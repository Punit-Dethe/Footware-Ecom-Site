"use server";

import { refreshCatalogTag } from "@/lib/cache/catalog-refresh";
import { requireAdmin, AdminAuthError } from "@/lib/auth/admin";
import {
  archiveAdminProduct,
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategoryIfSafe,
  restoreAdminProduct,
  saveAdminProduct,
  updateAdminCategory,
  CatalogValidationError,
  type SaveProductInput,
  type AdminProductDetail,
} from "@/lib/db/admin-catalog";

export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
  warning?: string;
}

/**
 * Creates a new draft product.
 */
export async function createProductAction(
  input: SaveProductInput,
): Promise<ActionState<{ id: string }>> {
  try {
    await requireAdmin();

    if (input.status && input.status !== "draft") {
      return {
        success: false,
        error: "New products must be created as draft before publishing.",
        fieldErrors: { status: "New products must be created as draft before publishing." },
      };
    }

    const productId = await createAdminProduct(input);

    // The product row is committed; a cache failure must not be reported as
    // a failed create (a retry would then hit the unique slug constraint).
    try {
      refreshCatalogTag("catalog-public");
    } catch (cacheError) {
      console.error("[admin-action] Product created; cache refresh failed:", cacheError);
    }

    return {
      success: true,
      data: { id: productId },
    };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Saves/updates an existing product, its categories, and its variants.
 * If target status is 'active', validates publish invariants.
 */
export async function saveProductAction(
  productId: string,
  input: SaveProductInput,
): Promise<ActionState<AdminProductDetail>> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Valid product ID is required" };
    }

    const updated = await saveAdminProduct(productId, input);

    // The transaction is already committed. Cache failures must not be reported
    // as a failed save, or an admin may repeat a successful mutation.
    let warning: string | undefined;
    try {
      refreshCatalogTag("catalog-public");
    } catch (cacheError) {
      console.error("[admin-action] Product saved; cache refresh failed:", cacheError);
      warning = "Storefront refresh failed; the new price may take time to appear.";
    }

    return {
      success: true,
      data: updated,
      ...(warning ? { warning } : {}),
    };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Archives a product.
 */
export async function archiveProductAction(
  productId: string,
): Promise<ActionState<void>> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Valid product ID is required" };
    }

    await archiveAdminProduct(productId);
    refreshCatalogTag("catalog-public");

    return { success: true };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Restores an archived product back to draft status.
 */
export async function restoreProductAction(
  productId: string,
): Promise<ActionState<void>> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Valid product ID is required" };
    }

    await restoreAdminProduct(productId);
    refreshCatalogTag("catalog-public");

    return { success: true };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Creates a new category.
 */
export async function createCategoryAction(data: {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  position?: number;
}): Promise<ActionState<{ id: string }>> {
  try {
    await requireAdmin();

    const categoryId = await createAdminCategory(data);
    refreshCatalogTag("catalog-public");

    return {
      success: true,
      data: { id: categoryId },
    };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Updates an existing category.
 */
export async function updateCategoryAction(
  categoryId: string,
  data: {
    name: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    position?: number;
  },
): Promise<ActionState<void>> {
  try {
    await requireAdmin();

    if (!categoryId || typeof categoryId !== "string") {
      return { success: false, error: "Valid category ID is required" };
    }

    await updateAdminCategory(categoryId, data);
    refreshCatalogTag("catalog-public");

    return { success: true };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Safely deletes an unreferenced category.
 */
export async function deleteCategoryAction(
  categoryId: string,
): Promise<ActionState<void>> {
  try {
    await requireAdmin();

    if (!categoryId || typeof categoryId !== "string") {
      return { success: false, error: "Valid category ID is required" };
    }

    await deleteAdminCategoryIfSafe(categoryId);
    refreshCatalogTag("catalog-public");

    return { success: true };
  } catch (err: any) {
    return handleActionError(err);
  }
}

/**
 * Explicitly invalidates the authoritative public catalog snapshot
 * and revalidates public storefront routes/layouts.
 */
export async function revalidatePublicCatalogAction(): Promise<ActionState<{ invalidated: boolean }>> {
  try {
    await requireAdmin();
    refreshCatalogTag("catalog-public");
    return {
      success: true,
      data: { invalidated: true },
    };
  } catch (err: any) {
    return handleActionError(err);
  }
}

function handleActionError(err: any): ActionState<any> {
  if (
    err instanceof AdminAuthError ||
    err?.name === "AdminAuthError" ||
    err?.message?.includes("Admin authorization required")
  ) {
    if (err.code === "INFRASTRUCTURE_ERROR") {
      console.error("[admin-action] Auth infrastructure error:", err);
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

  if (err instanceof CatalogValidationError || err?.name === "CatalogValidationError") {
    return {
      success: false,
      error: err.message,
      fieldErrors: err.field ? { [err.field]: err.message } : undefined,
    };
  }

  // Log unexpected database / network error server-side
  console.error("[admin-action] Internal error:", err);

  // Keep raw database text out of the client, but say which kind of failure
  // happened so admins can tell a busy/unreachable database from a bug.
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  let category = "";
  if (msg.includes("timeout")) category = " (database timed out, please retry)";
  else if (msg.includes("connect") || msg.includes("econn")) category = " (database unreachable)";
  return {
    success: false,
    error: `An unexpected system error occurred. Changes were not saved.${category}`,
  };
}
