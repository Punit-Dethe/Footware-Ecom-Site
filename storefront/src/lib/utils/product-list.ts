import type { Product } from "@/types/commerce";

/**
 * Merges deferred catalog results without ever rendering the same product twice
 * or exceeding the total reported by the active product query.
 */
export function mergeUniqueProducts(
  current: Product[],
  incoming: Product[],
  totalCount: number,
): Product[] {
  const productsById = new Map<string, Product>();

  for (const product of current) productsById.set(product.id, product);
  for (const product of incoming) {
    if (!productsById.has(product.id)) productsById.set(product.id, product);
  }

  return Array.from(productsById.values()).slice(0, totalCount);
}
