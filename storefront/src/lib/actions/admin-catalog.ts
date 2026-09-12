"use server";

import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
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
} from "@/lib/db/admin-catalog";

export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
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
    updateTag("catalog-public");
    revalidatePath("/admin/products");

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
): Promise<ActionState<unknown>> {
  try {
    await requireAdmin();

    if (!productId || typeof productId !== "string") {
      return { success: false, error: "Valid product ID is required" };
    }

    const updated = await saveAdminProduct(productId, input);
    updateTag("catalog-public");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      data: updated,
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
    updateTag("catalog-public");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

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
    updateTag("catalog-public");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

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
    updateTag("catalog-public");
    revalidatePath("/admin/categories");

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
    updateTag("catalog-public");
    revalidatePath("/admin/categories");

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
    updateTag("catalog-public");
    revalidatePath("/admin/categories");

    return { success: true };
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

  return {
    success: false,
    error: "An unexpected system error occurred. Changes were not saved.",
  };
}
