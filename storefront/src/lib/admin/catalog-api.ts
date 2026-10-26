import type { ActionState } from "@/lib/actions/admin-catalog";
import type { AdminProductDetail, SaveProductInput } from "@/lib/db/admin-catalog";

/**
 * Browser-side helpers for the admin product endpoints in /api/admin/products.
 * They resolve to the same ActionState shape the forms already handle and
 * only reject on a genuine network failure.
 */
async function requestJson<T>(url: string, method: string, body: unknown): Promise<ActionState<T>> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    return JSON.parse(text) as ActionState<T>;
  } catch {
    return {
      success: false,
      error: `Server returned HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}: ${text.slice(0, 200) || "empty response"}`,
    };
  }
}

export function saveProductRequest(
  productId: string,
  input: SaveProductInput,
): Promise<ActionState<AdminProductDetail>> {
  return requestJson<AdminProductDetail>(
    `/api/admin/products/${encodeURIComponent(productId)}`,
    "PUT",
    input,
  );
}

export function createProductRequest(
  input: SaveProductInput,
): Promise<ActionState<{ id: string }>> {
  return requestJson<{ id: string }>("/api/admin/products", "POST", input);
}
