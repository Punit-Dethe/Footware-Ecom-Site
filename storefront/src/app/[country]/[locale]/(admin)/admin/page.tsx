import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCatalogOverview } from "@/lib/db/admin-catalog";

interface AdminIndexProps {
  params: Promise<{ country: string; locale: string }>;
}

export default function AdminIndexPage(props: AdminIndexProps) {
  return (
    <Suspense fallback={null}>
      <AdminIndexPageContent {...props} />
    </Suspense>
  );
}

export async function AdminIndexPageContent({ params }: AdminIndexProps) {
  await connection();
  await requireAdmin();
  const { country, locale } = await params;
  const overview = await getAdminCatalogOverview();
  const basePath = `/${country}/${locale}/admin`;
  const { metrics, recentProducts } = overview;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Mirza Studio</span>
          <h1 className="admin-title mt-1">Catalog Overview</h1>
          <p className="admin-subtitle mt-1">
            A quiet view of the collection and its working state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}/products/new`}
            className="admin-btn admin-btn-primary"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Metrics Sheet */}
      <div>
        <h2 className="admin-eyebrow mb-3">Catalog Vitals</h2>
        <div className="admin-metric-strip">
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.totalProducts}</span>
            <span className="admin-metric-label">Products</span>
            <span className="text-[11px] text-[#706257]">
              {metrics.activeProducts} active · {metrics.draftProducts} draft
            </span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.activeProducts}</span>
            <span className="admin-metric-label">Active</span>
            <span className="text-[11px] text-[#706257]">
              {metrics.activeZeroStockProducts > 0
                ? `${metrics.activeZeroStockProducts} zero stock`
                : "All in stock"}
            </span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.draftProducts}</span>
            <span className="admin-metric-label">Drafts</span>
            <span className="text-[11px] text-[#706257]">Unpublished</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.archivedProducts}</span>
            <span className="admin-metric-label">Archived</span>
            <span className="text-[11px] text-[#706257]">Hidden from store</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.totalCategories}</span>
            <span className="admin-metric-label">Categories</span>
            <span className="text-[11px] text-[#706257]">Storefront groupings</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.managedMediaCount}</span>
            <span className="admin-metric-label">Managed Media</span>
            <span className="text-[11px] text-[#706257]">Contract v1 assets</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.totalVariants}</span>
            <span className="admin-metric-label">Variants</span>
            <span className="text-[11px] text-[#706257]">{metrics.totalStock} units in stock</span>
          </div>
        </div>
      </div>

      {/* Commerce Activity Strip */}
      <div className="space-y-3">
        <h2 className="admin-eyebrow">Commerce Activity</h2>
        <div className="admin-metric-strip grid grid-cols-2 sm:grid-cols-4">
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.totalOrders ?? 0}</span>
            <span className="admin-metric-label">Total Orders</span>
            <span className="text-[11px] text-[#706257]">
              {metrics.ordersToday ?? 0} completed today
            </span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.registeredCustomers ?? 0}</span>
            <span className="admin-metric-label">Registered Customers</span>
            <span className="text-[11px] text-[#706257]">Active member accounts</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">{metrics.guestOrders ?? 0}</span>
            <span className="admin-metric-label">Guest Checkouts</span>
            <span className="text-[11px] text-[#706257]">Anonymous orders</span>
          </div>
          <div className="admin-metric-item">
            <span className="admin-metric-number">
              {(metrics.totalOrders ?? 0) - (metrics.guestOrders ?? 0)}
            </span>
            <span className="admin-metric-label">Member Orders</span>
            <span className="text-[11px] text-[#706257]">Account checkouts</span>
          </div>
        </div>
      </div>

      {/* Recently Edited Table */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="admin-eyebrow">Recently Edited</h2>
            <p className="text-xs text-[#706257]">Last touched products across the catalog</p>
          </div>
          <Link
            href={`${basePath}/products`}
            className="text-xs font-medium text-[#706257] hover:text-[#30261f] transition-colors"
          >
            View All Products &rarr;
          </Link>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="admin-th w-14">Media</th>
                <th scope="col" className="admin-th">Product</th>
                <th scope="col" className="admin-th">Status</th>
                <th scope="col" className="admin-th">Variants / Stock</th>
                <th scope="col" className="admin-th">Updated</th>
                <th scope="col" className="admin-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-td text-center text-[#706257] py-10">
                    No products in the catalog database yet.
                  </td>
                </tr>
              ) : (
                recentProducts.map((product) => {
                  let badgeClass = "admin-badge--draft";
                  if (product.status === "active") badgeClass = "admin-badge--active";
                  else if (product.status === "archived") badgeClass = "admin-badge--archived";

                  return (
                    <tr key={product.id} className="admin-tr">
                      <td className="admin-td">
                        <div className="admin-stone-frame w-11 h-11 shrink-0 rounded-[2px]">
                          {product.heroThumbnailUrl ? (
                            <Image
                              src={product.heroThumbnailUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <span className="text-[9px] text-[#706257] uppercase tracking-wider font-mono">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="admin-td">
                        <Link
                          href={`${basePath}/products/${product.id}`}
                          className="font-medium text-[#30261f] hover:underline block"
                        >
                          {product.name}
                        </Link>
                        <div className="text-xs text-[#706257] font-mono mt-0.5">
                          {product.sku || product.slug}
                        </div>
                      </td>
                      <td className="admin-td">
                        <span className={`admin-badge ${badgeClass}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="admin-td text-xs text-[#706257]">
                        <span className="text-[#30261f] font-medium">{product.variantCount}</span> variants ·{" "}
                        <span className="text-[#30261f] font-medium">{product.totalStock}</span> units
                      </td>
                      <td className="admin-td text-xs text-[#706257] whitespace-nowrap">
                        {new Date(product.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="admin-td text-right">
                        <Link
                          href={`${basePath}/products/${product.id}`}
                          className="admin-btn admin-btn-quiet !py-1 !px-2.5 !text-[10px]"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Work Navigation */}
      <div className="border-t border-[#cfc4b6] pt-8">
        <h2 className="admin-eyebrow mb-4">Quick Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`${basePath}/orders`}
            className="p-5 border border-[#cfc4b6] bg-[#fffefc] hover:bg-[#e9e2d6]/40 transition-colors rounded-[2px] block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#30261f]">
                Orders
              </span>
              <span className="text-xs text-[#706257] group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </div>
            <p className="text-xs text-[#706257] mt-1.5 leading-relaxed">
              Review completed checkouts, items, address snapshots, and totals.
            </p>
          </Link>

          <Link
            href={`${basePath}/customers`}
            className="p-5 border border-[#cfc4b6] bg-[#fffefc] hover:bg-[#e9e2d6]/40 transition-colors rounded-[2px] block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#30261f]">
                Customers
              </span>
              <span className="text-xs text-[#706257] group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </div>
            <p className="text-xs text-[#706257] mt-1.5 leading-relaxed">
              Inspect registered accounts, saved addresses, and order histories.
            </p>
          </Link>

          <Link
            href={`${basePath}/products/new`}
            className="p-5 border border-[#cfc4b6] bg-[#fffefc] hover:bg-[#e9e2d6]/40 transition-colors rounded-[2px] block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#30261f]">
                New Product
              </span>
              <span className="text-xs text-[#706257] group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </div>
            <p className="text-xs text-[#706257] mt-1.5 leading-relaxed">
              Create a new draft product, assign categories, and configure variants.
            </p>
          </Link>

          <Link
            href={`${basePath}/media`}
            className="p-5 border border-[#cfc4b6] bg-[#fffefc] hover:bg-[#e9e2d6]/40 transition-colors rounded-[2px] block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#30261f]">
                Media Library
              </span>
              <span className="text-xs text-[#706257] group-hover:translate-x-0.5 transition-transform">
                &rarr;
              </span>
            </div>
            <p className="text-xs text-[#706257] mt-1.5 leading-relaxed">
              Upload, preview, and curate high-resolution studio assets.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
