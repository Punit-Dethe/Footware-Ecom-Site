"use client";

import type { PaginatedResponse, Product, ProductListParams } from "@spree/sdk";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";

interface InfiniteProductListProps {
  initialProducts: Product[];
  totalCount: number;
  listParams: ProductListParams;
  fetchRemainder: (
    params: ProductListParams,
  ) => Promise<PaginatedResponse<Product>>;
  basePath: string;
  categoryId?: string;
  listId?: string;
  listName?: string;
  currency?: string;
}

/**
 * Product listing with deferred bulk remainder fetch.
 *
 * Renders the server-rendered first 12 products immediately. Exactly 1200 ms
 * after mount (safely after initial mobile paint and LCP image resolution),
 * performs a single bulk request for all remaining matching products and appends
 * them once.
 *
 * Eliminates IntersectionObserver, scroll sentinels, loading spinners,
 * page-by-page state machines, and continuous-scroll stalls.
 */
export function InfiniteProductList({
  initialProducts,
  totalCount,
  listParams,
  fetchRemainder,
  basePath,
  categoryId,
  listId,
  listName,
  currency,
}: InfiniteProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // If all matching products are already displayed, no remainder fetch needed
    if (totalCount <= initialProducts.length) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await fetchRemainder({
          ...listParams,
          offset: initialProducts.length,
          limit: 100,
        });
        if (active && response.data.length > 0) {
          setProducts((prev) => [...prev, ...response.data]);
        }
      } catch (error) {
        console.error("InfiniteProductList: failed to load remainder", error);
      }
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchRemainder, initialProducts.length, listParams, totalCount]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          basePath={basePath}
          categoryId={categoryId}
          index={index}
          listId={listId}
          listName={listName}
          fetchPriority={index === 0 ? "high" : undefined}
          currency={currency}
        />
      ))}
    </div>
  );
}
