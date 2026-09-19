import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminCustomersPage } from "@/lib/db/admin-commerce";
import { CustomerFilterBar } from "@/components/admin/CustomerFilterBar";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Customers | Mirza Studio",
  description: "Directory of registered customer accounts and order histories.",
  robots: { index: false, follow: false },
};

interface AdminCustomersPageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function AdminCustomersPage({
  params,
  searchParams,
}: AdminCustomersPageProps) {
  await requireAdmin();

  const { country, locale } = await params;
  const sParams = await searchParams;

  const basePath = `/${country}/${locale}/admin`;
  const page = Math.max(1, Number.parseInt(sParams.page || "1", 10) || 1);
  const query = sParams.q || "";
  const sort =
    (sParams.sort as "newest" | "oldest" | "latest_order" | "most_orders") ||
    "newest";

  const { customers, totalCount, totalPages, pageSize } =
    await listAdminCustomersPage({
      page,
      pageSize: 30,
      query,
      sort,
    });

  const fromCount = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toCount = Math.min(page * pageSize, totalCount);

  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (sort !== "newest") p.set("sort", sort);
    if (targetPage > 1) p.set("page", targetPage.toString());
    const qs = p.toString();
    return `${basePath}/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#cfc4b6] pb-6">
        <div>
          <span className="admin-eyebrow">Commerce Operations</span>
          <h1 className="admin-title mt-1">Customers</h1>
          <p className="admin-body text-[#706257] mt-1 text-sm">
            Directory of registered customer accounts, order history, and account activity.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-[#706257] tabular-nums">
            {totalCount} {totalCount === 1 ? "Customer" : "Customers"} Registered
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <CustomerFilterBar currentQuery={query} currentSort={sort} />

      {/* Customers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-th">Customer Name</th>
              <th scope="col" className="admin-th">Email</th>
              <th scope="col" className="admin-th">Phone</th>
              <th scope="col" className="admin-th text-right">Orders</th>
              <th scope="col" className="admin-th text-right">Placed Order Value</th>
              <th scope="col" className="admin-th">Last Order</th>
              <th scope="col" className="admin-th">Joined</th>
              <th scope="col" className="admin-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-td text-center text-[#706257] py-12">
                  {query
                    ? "No customers match this search."
                    : "No registered customers yet."}
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const fullName =
                  [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
                  "Unnamed Member";

                return (
                  <tr key={customer.id} className="admin-tr">
                    {/* Customer Name */}
                    <td className="admin-td font-medium text-xs text-[#30261f]">
                      <Link
                        href={`${basePath}/customers/${customer.id}`}
                        className="hover:underline underline-offset-2"
                      >
                        {fullName}
                      </Link>
                    </td>

                    {/* Email */}
                    <td className="admin-td text-xs text-[#706257]">
                      <Link
                        href={`${basePath}/customers/${customer.id}`}
                        className="text-[#30261f] hover:underline underline-offset-2"
                      >
                        {customer.email}
                      </Link>
                    </td>

                    {/* Phone */}
                    <td className="admin-td text-xs text-[#706257] tabular-nums">
                      {customer.phone || "—"}
                    </td>

                    {/* Orders Count */}
                    <td className="admin-td text-xs text-[#706257] text-right tabular-nums">
                      {customer.orderCount}
                    </td>

                    {/* Placed Order Value */}
                    <td className="admin-td font-medium text-xs text-[#30261f] text-right tabular-nums">
                      {customer.placedOrderTotals.length === 0 ? (
                        <span className="text-[#706257] font-normal">—</span>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          {customer.placedOrderTotals.map((tot) => (
                            <span key={tot.currency}>
                              {formatMoney(tot.totalInCents, tot.currency)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Last Order Date */}
                    <td className="admin-td text-xs text-[#706257]">
                      {customer.latestOrderAt
                        ? customer.latestOrderAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "None"}
                    </td>

                    {/* Joined Date */}
                    <td className="admin-td text-xs text-[#706257]">
                      {customer.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action */}
                    <td className="admin-td text-right">
                      <Link
                        href={`${basePath}/customers/${customer.id}`}
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
            Showing {fromCount}–{toCount} of {totalCount} customers
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

              <span className="text-[11px] px-2 tabular-nums">
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
