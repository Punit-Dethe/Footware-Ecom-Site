import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  listAdminCategories,
  listAdminProductsPage,
} from "@/lib/db/admin-catalog";
import { ProductFilterBar } from "@/components/admin/ProductFilterBar";

interface AdminProductsPageProps {
  params: Promise<{ country: string; locale: string }>;
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({
  params,
  searchParams,
}: AdminProductsPageProps) {
  await connection();
  await requireAdmin();
  const { country, locale } = await params;
  const queryParams = (await searchParams) || {};

  const query = queryParams.q?.trim() || "";
  const statusParam = queryParams.status;
  const validStatus =
    statusParam === "active" || statusParam === "draft" || statusParam === "archived"
      ? statusParam
      : "all";

  const categoryId = queryParams.category || undefined;

  let sort: "updated_desc" | "name_asc" | "stock_asc" | "stock_desc" = "updated_desc";
  if (queryParams.sort === "name_asc") {
    sort = "name_asc";
  } else if (queryParams.sort === "stock_low") {
    sort = "stock_asc";
  } else if (queryParams.sort === "stock_high") {
    sort = "stock_desc";
  }

  const page = Math.max(1, Number(queryParams.page) || 1);
  const pageSize = 30;

  const [categories, pageResult] = await Promise.all([
    listAdminCategories(),
    listAdminProductsPage({
      query,
      status: validStatus,
      categoryId,
      sort,
      page,
      pageSize,
    }),
  ]);

  const { products, totalCount, totalPages } = pageResult;
  const basePath = `/${country}/${locale}/admin`;

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  // Helper to build pagination URLs
  const createPageUrl = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (validStatus !== "all") sp.set("status", validStatus);
    if (categoryId) sp.set("category", categoryId);
    if (queryParams.sort && queryParams.sort !== "updated_desc") {
      sp.set("sort", queryParams.sort);
    }
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return `${basePath}/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Catalog Management</span>
          <h1 className="admin-title mt-1">Products</h1>
          <p className="admin-subtitle mt-1">
            The working Mirza catalog.
          </p>
        </div>
        <div>
          <Link
            href={`${basePath}/products/new`}
            className="admin-btn admin-btn-primary"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <ProductFilterBar
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        currentQuery={query}
        currentStatus={validStatus}
        currentCategory={categoryId}
        currentSort={queryParams.sort || "updated_desc"}
      />

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-th w-14">Media</th>
              <th scope="col" className="admin-th">Product</th>
              <th scope="col" className="admin-th">SKU</th>
              <th scope="col" className="admin-th">Status</th>
              <th scope="col" className="admin-th">Category</th>
              <th scope="col" className="admin-th">Variants / Price</th>
              <th scope="col" className="admin-th">Stock</th>
              <th scope="col" className="admin-th">Updated</th>
              <th scope="col" className="admin-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-td text-center text-[#706257] py-16">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-medium text-[#30261f]">No products found</p>
                    <p className="text-xs text-[#706257]">
                      {query || validStatus !== "all" || categoryId
                        ? "Try clearing active search or filter criteria."
                        : "Your catalog currently has no products registered."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                let badgeClass = "admin-badge--draft";
                if (p.status === "active") badgeClass = "admin-badge--active";
                else if (p.status === "archived") badgeClass = "admin-badge--archived";

                let priceDisplay = "—";
                if (p.minPriceInCents != null && p.maxPriceInCents != null) {
                  if (p.minPriceInCents === p.maxPriceInCents) {
                    priceDisplay = `$${(p.minPriceInCents / 100).toFixed(2)}`;
                  } else {
                    priceDisplay = `$${(p.minPriceInCents / 100).toFixed(2)} – $${(p.maxPriceInCents / 100).toFixed(2)}`;
                  }
                }

                return (
                  <tr key={p.id} className="admin-tr">
                    <td className="admin-td">
                      <div className="admin-stone-frame w-12 h-12 shrink-0 rounded-[2px]">
                        {p.heroThumbnailUrl ? (
                          <Image
                            src={p.heroThumbnailUrl}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <span className="text-[9px] text-[#706257] uppercase tracking-wider">
                            None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="admin-td">
                      <Link
                        href={`${basePath}/products/${p.id}`}
                        className="font-medium text-[#30261f] hover:underline block text-sm"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-[#706257] mt-0.5">
                        {p.slug}
                      </div>
                    </td>
                    <td className="admin-td text-xs text-[#706257] tabular-nums">
                      {p.sku || "—"}
                    </td>
                    <td className="admin-td whitespace-nowrap">
                      <span className={`admin-badge ${badgeClass}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="admin-td text-xs text-[#706257]">
                      {p.categories.map((c) => c.name).join(", ") || "—"}
                    </td>
                    <td className="admin-td text-xs">
                      <div className="text-[#30261f] font-medium">{p.variantCount} variants</div>
                      <div className="text-[#706257]">{priceDisplay}</div>
                    </td>
                    <td className="admin-td text-xs whitespace-nowrap">
                      <span className={p.totalStock === 0 ? "text-[#8f2d2d] font-medium" : "text-[#30261f]"}>
                        {p.totalStock} units
                      </span>
                    </td>
                    <td className="admin-td text-xs text-[#706257] whitespace-nowrap">
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="admin-td text-right whitespace-nowrap">
                      <Link
                        href={`${basePath}/products/${p.id}`}
                        className="admin-btn admin-btn-quiet !py-1 !px-2.5 !text-[10px]"
                      >
                        Edit &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="admin-pagination">
          <div>
            Showing <span className="font-medium text-[#30261f]">{startRecord}</span> to{" "}
            <span className="font-medium text-[#30261f]">{endRecord}</span> of{" "}
            <span className="font-medium text-[#30261f]">{totalCount}</span> products
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={createPageUrl(page - 1)}
              className="admin-pagination-btn"
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
            >
              &larr; Previous
            </Link>
            <span className="text-xs text-[#706257] px-2 tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Link
              href={createPageUrl(page + 1)}
              className="admin-pagination-btn"
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
            >
              Next &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
