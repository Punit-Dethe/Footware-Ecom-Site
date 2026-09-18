import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCustomerDetail } from "@/lib/db/admin-commerce";
import { formatMoney } from "@/lib/utils/format";

interface AdminCustomerDetailPageProps {
  params: Promise<{
    country: string;
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: AdminCustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Customer ${id} | Mirza Studio`,
    description: "Customer profile, saved addresses, and order history.",
    robots: { index: false, follow: false },
  };
}

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  await requireAdmin();

  const { country, locale, id } = await params;
  const basePath = `/${country}/${locale}/admin`;

  const customer = await getAdminCustomerDetail(id);
  if (!customer) {
    notFound();
  }

  const fullName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
    "Unnamed Member";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back Navigation */}
      <div>
        <Link
          href={`${basePath}/customers`}
          className="text-xs font-mono text-[#706257] hover:text-[#30261f] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to Customers
        </Link>
      </div>

      {/* Customer Header */}
      <div className="border-b border-[#cfc4b6] pb-6 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="admin-eyebrow">Customer Account</span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#30261f] bg-[#e9e2d6] px-2 py-0.5 rounded-[2px] font-semibold">
              Member
            </span>
          </div>
          <h1 className="admin-title text-2xl mt-1 tracking-tight">{fullName}</h1>
          <p className="admin-body font-mono text-xs text-[#706257] mt-1">
            {customer.email}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-left md:text-right">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#a39e93] block">
              Orders
            </span>
            <span className="font-mono text-sm font-medium text-[#30261f]">
              {customer.totalOrderCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#a39e93] block">
              Placed Orders
            </span>
            <span className="font-mono text-sm font-medium text-[#30261f]">
              {customer.placedOrderCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-[#a39e93] block">
              Placed Order Value
            </span>
            <div className="font-mono text-sm font-medium text-[#30261f] flex flex-col items-start md:items-end gap-0.5">
              {(customer.placedOrderTotals || []).length === 0 ? (
                <span>—</span>
              ) : (
                customer.placedOrderTotals.map((tot) => (
                  <span key={tot.currency}>
                    {formatMoney(tot.totalInCents, tot.currency)}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Identity & Saved Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Identity Information */}
        <div className="border border-[#e5e0d8] bg-[#fffefc] p-5 rounded-[2px] space-y-3">
          <h2 className="admin-eyebrow">Account Identity</h2>
          <div className="text-xs space-y-2 text-[#706257]">
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase font-mono">
                Email Address
              </span>
              <span className="font-mono text-[#30261f] select-all">{customer.email}</span>
            </div>
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase font-mono">
                Phone Number
              </span>
              <span className="font-mono text-[#30261f]">
                {customer.phone || "Not provided"}
              </span>
            </div>
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase font-mono">
                Member Joined
              </span>
              <span>
                {customer.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase font-mono">
                User UUID
              </span>
              <span className="font-mono text-[10px] text-[#a39e93] select-all break-all">
                {customer.id}
              </span>
            </div>
          </div>
        </div>

        {/* Saved Addresses (Col span 2) */}
        <div className="md:col-span-2 border border-[#e5e0d8] bg-[#fffefc] p-5 rounded-[2px] space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="admin-eyebrow">Saved Addresses</h2>
            <span className="text-xs font-mono text-[#a39e93]">
              {customer.addresses.length}{" "}
              {customer.addresses.length === 1 ? "address" : "addresses"}
            </span>
          </div>

          {customer.addresses.length === 0 ? (
            <p className="text-xs text-[#706257] py-4 italic">
              No saved addresses on file.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3.5 bg-[#fbf9f6] border border-[#e5e0d8] rounded-[2px] text-xs text-[#706257] space-y-1"
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {addr.isDefaultShipping && (
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-[#e9e2d6] text-[#30261f] px-1.5 py-0.5 rounded-[2px]">
                        Default Shipping
                      </span>
                    )}
                    {addr.isDefaultBilling && (
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-[#f5f2ec] border border-[#cfc4b6] text-[#706257] px-1.5 py-0.5 rounded-[2px]">
                        Default Billing
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-[#30261f]">
                    {addr.firstName} {addr.lastName}
                  </p>
                  {addr.company && <p>{addr.company}</p>}
                  <p>{addr.address1}</p>
                  {addr.address2 && <p>{addr.address2}</p>}
                  <p>
                    {[addr.city, addr.stateAbbr || addr.state, addr.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{addr.countryIso}</p>
                  {addr.phone && (
                    <p className="font-mono text-[11px] pt-1">Phone: {addr.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-[#a39e93] pt-2 italic">
            Customer addresses are managed directly by the account holder in the storefront. Addresses cannot be mutated from this studio view.
          </p>
        </div>
      </div>

      {/* Order History */}
      <div className="space-y-3 pt-4 border-t border-[#e5e0d8]">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="admin-eyebrow">Order History</h2>
            <p className="text-xs text-[#706257]">
              Historical checkouts linked strictly to user ID ({customer.id})
            </p>
          </div>
          <span className="text-xs font-mono text-[#a39e93]">
            {customer.orders.length} {customer.orders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="admin-th">Order Number</th>
                <th scope="col" className="admin-th">Completed Date</th>
                <th scope="col" className="admin-th">Status</th>
                <th scope="col" className="admin-th">Items</th>
                <th scope="col" className="admin-th">Surface</th>
                <th scope="col" className="admin-th text-right">Total</th>
                <th scope="col" className="admin-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-td text-center text-[#706257] py-10">
                    No orders found for this customer account.
                  </td>
                </tr>
              ) : (
                customer.orders.map((order) => {
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

                      {/* Completed Date */}
                      <td className="admin-td text-xs text-[#706257]">
                        {order.completedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
                      <td className="admin-td font-mono text-xs text-[#706257]">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </td>

                      {/* Surface */}
                      <td className="admin-td font-mono text-[10px] uppercase text-[#706257]">
                        {order.surface}
                      </td>

                      {/* Total */}
                      <td className="admin-td font-mono font-medium text-xs text-[#30261f] text-right">
                        {formatMoney(order.totalInCents, order.currency)}
                      </td>

                      {/* Action */}
                      <td className="admin-td text-right">
                        <Link
                          href={`${basePath}/orders/${order.id}`}
                          className="text-xs font-medium text-[#706257] hover:text-[#30261f] transition-colors"
                        >
                          View Order &rarr;
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
    </div>
  );
}
