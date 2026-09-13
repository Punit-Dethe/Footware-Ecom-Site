"use client";

import type { PaginatedResponse, Product, ProductListParams } from "@/types/commerce";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
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
  editorialBreak?: boolean;
  editorialHref?: string;
  editorialCopy?: { label: string; title: string; action: string };
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
  editorialBreak = false,
  editorialHref,
  editorialCopy,
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
    <div className="catalog-products-grid grid grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <Fragment key={product.id}>
          {editorialBreak && index === 8 && editorialCopy && editorialHref && (
            <aside className="catalog-story">
              <Image
                src="/editorial/craft-hands.webp"
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 90vw"
                className="object-cover"
              />
              <div className="catalog-story__content">
                <p>{editorialCopy.label}</p>
                <h2>{editorialCopy.title}</h2>
                <Link href={editorialHref}>{editorialCopy.action}</Link>
              </div>
            </aside>
          )}
          <div className="catalog-products-grid__cell">
            <ProductCard
              product={product}
              basePath={basePath}
              categoryId={categoryId}
              index={index}
              listId={listId}
              listName={listName}
              fetchPriority={index === 0 ? "high" : undefined}
              currency={currency}
            />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
