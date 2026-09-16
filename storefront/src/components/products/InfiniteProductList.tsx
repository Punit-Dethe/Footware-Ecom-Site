"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { mergeUniqueProducts } from "@/lib/utils/product-list";
import type {
  PaginatedResponse,
  Product,
  ProductListParams,
} from "@/types/commerce";

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
  editorialGridFeature?: boolean;
  editorialGridCopy?: { title: string; description: string };
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
  editorialGridFeature = false,
  editorialGridCopy,
}: InfiniteProductListProps) {
  const preparedInitialProducts = useMemo(
    () => mergeUniqueProducts([], initialProducts, totalCount),
    [initialProducts, totalCount],
  );
  const [products, setProducts] = useState<Product[]>(preparedInitialProducts);

  useEffect(() => {
    setProducts(preparedInitialProducts);
  }, [preparedInitialProducts]);

  useEffect(() => {
    // If all matching products are already displayed, no remainder fetch needed
    const remainingCount = totalCount - preparedInitialProducts.length;
    if (remainingCount <= 0) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await fetchRemainder({
          ...listParams,
          offset: preparedInitialProducts.length,
          limit: Math.min(100, remainingCount),
        });
        if (active && response.data.length > 0) {
          setProducts((current) =>
            mergeUniqueProducts(current, response.data, totalCount),
          );
        }
      } catch (error) {
        console.error("InfiniteProductList: failed to load remainder", error);
      }
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchRemainder, listParams, preparedInitialProducts, totalCount]);

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
          {editorialGridFeature &&
            index === 20 &&
            editorialGridCopy &&
            editorialHref && (
              <aside className="catalog-grid-feature">
                <div className="catalog-grid-feature__image">
                  <Image
                    src="/editorial/heritage-architecture.webp"
                    alt=""
                    fill
                    sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1600px) 46vw, 714px"
                  />
                </div>
                <div className="catalog-grid-feature__content">
                  <h2>{editorialGridCopy.title}</h2>
                  <p className="catalog-grid-feature__description">
                    {editorialGridCopy.description}
                  </p>
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
