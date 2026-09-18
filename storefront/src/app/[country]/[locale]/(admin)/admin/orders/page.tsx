import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminOrdersPage } from "@/lib/db/admin-commerce";
import { OrderFilterBar } from "@/components/admin/OrderFilterBar";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Orders | Mirza Studio",
  description: "Operational record of customer orders and checkout activity.",
  robots: { index: false, follow: false },
};

interface AdminOrdersPageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    customer?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: AdminOrdersPageProps) {
  await requireAdmin();

  const { country, locale } = await params;
  const sParams = await searchParams;

  const basePath = `/${country}/${locale}/admin`;
  const page = Math.max(1, Number.parseInt(sParams.page || "1", 10) || 1);
  const query = sParams.q || "";
  const status = (sParams.status as "all" | "placed" | "cancelled") || "all";
  const customerType = (sParams.customer as "all" | "registered" | "guest") || "all";
  const sort = sParams.sort === "oldest" ? "oldest" : "newest";

  const { orders, totalCount, totalPages, pageSize } = await listAdminOrdersPage({
    page,
    pageSize: 30,
    query,
    status,
    customerType,
    sort,
  });

  const fromCount = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toCount = Math.min(page * pageSize, totalCount);

  // Helper to build URL for pagination
  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (status !== "all") p.set("status", status);
    if (customerType !== "all") p.set("customer", customerType);
    if (sort !== "newest") p.set("sort", sort);
    if (targetPage > 1) p.set("page", targetPage.toString());
    const qs = p.toString();
    return `${basePath}/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Commerce Operations</span>
          <h1 className="admin-title mt-1">Orders</h1>
          <p className="admin-body text-[#706257] mt-1 text-sm">
            A quiet record of placed customer checkout activity and historical order data.
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs text-[#706257]">
            {totalCount} {totalCount === 1 ? "Order" : "Orders"} Recorded
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <OrderFilterBar
        currentQuery={query}
        currentStatus={status}
        currentCustomer={customerType}
        currentSort={sort}
      />

      {/* Orders Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-th">Order Number</th>
              <th scope="col" className="admin-th">Placed</th>
              <th scope="col" className="admin-th">Customer</th>
              <th scope="col" className="admin-th">Type</th>
              <th scope="col" className="admin-th">Status</th>
              <th scope="col" className="admin-th">Items</th>
              <th scope="col" className="admin-th">Total</th>
              <th scope="col" className="admin-th">Surface</th>
              <th scope="col" className="admin-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-td text-center text-[#706257] py-12">
                  {query || status !== "all" || customerType !== "all"
                    ? "No orders match these filters."
                    : "No orders recorded yet."}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isCancelled = order.status === "cancelled";
                return (
                  <tr key={order.id} className="admin-tr">
                    {/* Order Number */}
                    <td className="admin-td font-mono font-medium text-xs">
                      <Link
                        href={`${basePath}/orders/${order.id}`}
                        className="text-[#30261f] hover:underline underline-offset-2"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    {/* Placed Date */}
                    <td className="admin-td text-xs text-[#706257]">
                      {order.completedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Customer / Email */}
                    <td className="admin-td text-xs">
                      {order.userId ? (
                        <Link
                          href={`${basePath}/customers/${order.userId}`}
                          className="text-[#30261f] hover:underline underline-offset-2 font-mono text-[11px]"
                          title="View customer profile"
                        >
                          {order.email}
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px] text-[#706257]">
                          {order.email}
                        </span>
                      )}
                    </td>

                    {/* Customer Type */}
                    <td className="admin-td">
                      {order.isRegisteredCustomer ? (
                        <span className="text-[10px] font-mono tracking-wider uppercase text-[#30261f] bg-[#e9e2d6]/60 px-1.5 py-0.5 rounded-[2px]">
                          Member
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono tracking-wider uppercase text-[#706257] bg-[#f5f2ec] px-1.5 py-0.5 rounded-[2px]">
                          Guest
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="admin-td">
                      <span
                        className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-[2px] ${
                          isCancelled
                            ? "bg-[#f5f2ec] text-[#706257] border border-[#cfc4b6]"
                            : "bg-[#e9e2d6] text-[#30261f] font-semibold"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="admin-td text-xs text-[#706257] font-mono">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      {order.totalUnits > order.itemCount && (
                        <span className="text-[11px] text-[#a39e93] ml-1">
                          ({order.totalUnits} units)
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="admin-td font-mono font-medium text-xs text-[#30261f]">
                      {formatMoney(order.totalInCents, order.currency)}
                    </td>

                    {/* Surface */}
                    <td className="admin-td">
                      <span className="text-[10px] font-mono uppercase text-[#706257]">
                        {order.surface}
                      </span>
                    </td>

                    {/* Action Link */}
                    <td className="admin-td text-right">
                      <Link
                        href={`${basePath}/orders/${order.id}`}
                        className="text-xs font-medium text-[#706257] hover:text-[#30261f] transition-colors"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e5e0d8] text-xs text-[#706257]">
          <span>
            Showing {fromCount}–{toCount} of {totalCount} orders
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildPageUrl(page - 1)}
                  className="admin-btn admin-btn-quiet py-1.5 px-3 text-xs"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span className="admin-btn admin-btn-quiet py-1.5 px-3 text-xs opacity-40 cursor-not-allowed">
                  &larr; Previous
                </span>
              )}

              <span className="font-mono text-[11px] px-2">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={buildPageUrl(page + 1)}
                  className="admin-btn admin-btn-quiet py-1.5 px-3 text-xs"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="admin-btn admin-btn-quiet py-1.5 px-3 text-xs opacity-40 cursor-not-allowed">
                  Next &rarr;
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
