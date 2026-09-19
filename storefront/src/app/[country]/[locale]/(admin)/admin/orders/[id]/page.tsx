import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminOrderDetail } from "@/lib/db/admin-commerce";
import { formatMoney } from "@/lib/utils/format";

interface AdminOrderDetailPageProps {
  params: Promise<{
    country: string;
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id} | Mirza Studio`,
    description: "Historical order snapshot and checkout records.",
    robots: { index: false, follow: false },
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  await requireAdmin();

  const { country, locale, id } = await params;
  const basePath = `/${country}/${locale}/admin`;

  const order = await getAdminOrderDetail(id);
  if (!order) {
    notFound();
  }

  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back Navigation */}
      <div>
        <Link
          href={`${basePath}/orders`}
          className="text-xs text-[#706257] hover:text-[#30261f] transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <div className="border-b border-[#cfc4b6] pb-6 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="admin-eyebrow">Order Record</span>
            <span
              className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-[2px] ${
                isCancelled
                  ? "bg-[#f5f2ec] text-[#706257] border border-[#cfc4b6]"
                  : "bg-[#e9e2d6] text-[#30261f] font-semibold"
              }`}
            >
              {order.status}
            </span>
          </div>
          <h1 className="admin-title text-2xl mt-1 tracking-tight tabular-nums">
            {order.orderNumber}
          </h1>
          <p className="admin-body text-xs text-[#706257] mt-1">
            Completed on{" "}
            {order.completedAt.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Customer Quick Identification */}
        <div className="text-left md:text-right">
          {order.isRegisteredCustomer && order.userId ? (
            <div>
              <span className="text-[10px] tracking-wider uppercase text-[#30261f] bg-[#e9e2d6]/60 px-2 py-0.5 rounded-[2px]">
                Registered Member
              </span>
              <div className="mt-1">
                <Link
                  href={`${basePath}/customers/${order.userId}`}
                  className="text-xs text-[#30261f] hover:underline"
                >
                  {order.email}
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[10px] tracking-wider uppercase text-[#706257] bg-[#f5f2ec] px-2 py-0.5 rounded-[2px]">
                Guest Checkout
              </span>
              <div className="text-xs text-[#706257] mt-1">{order.email}</div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Items Table */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="admin-eyebrow">Purchased Items</h2>
          <span className="text-xs text-[#706257] tabular-nums">
            {order.items.length} {order.items.length === 1 ? "line item" : "line items"}
          </span>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="admin-th w-14">Media</th>
                <th scope="col" className="admin-th">Product Details</th>
                <th scope="col" className="admin-th">SKU</th>
                <th scope="col" className="admin-th">Size</th>
                <th scope="col" className="admin-th text-right">Unit Price</th>
                <th scope="col" className="admin-th text-right">Qty</th>
                <th scope="col" className="admin-th text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="admin-tr">
                  {/* Thumbnail Snapshot */}
                  <td className="admin-td">
                    <div className="admin-stone-frame w-11 h-11 shrink-0 rounded-[2px] relative overflow-hidden bg-[#e9e2d6]">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.productName}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#706257]">
                          N/A
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Product Name Snapshot */}
                  <td className="admin-td">
                    <span className="font-medium text-xs text-[#30261f]">
                      {item.productName}
                    </span>
                  </td>

                  {/* SKU Snapshot */}
                  <td className="admin-td text-xs text-[#706257] tabular-nums">
                    {item.sku}
                  </td>

                  {/* Size Snapshot */}
                  <td className="admin-td text-xs text-[#706257]">
                    {item.sizeOption || "—"}
                  </td>

                  {/* Unit Price */}
                  <td className="admin-td text-xs text-[#706257] text-right tabular-nums">
                    {formatMoney(item.priceInCents, order.currency)}
                  </td>

                  {/* Quantity */}
                  <td className="admin-td text-xs text-[#30261f] text-right tabular-nums">
                    {item.quantity}
                  </td>

                  {/* Line Total */}
                  <td className="admin-td text-xs text-[#30261f] text-right font-medium tabular-nums">
                    {formatMoney(item.totalInCents, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Addresses & Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-[#e5e0d8]">
        {/* Customer Identity */}
        <div className="border border-[#e5e0d8] bg-[#fffefc] p-5 rounded-[2px] space-y-3">
          <h3 className="admin-eyebrow">Customer Identity</h3>
          <div className="text-xs space-y-1.5 text-[#706257]">
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase">
                Email
              </span>
              <span className="text-[#30261f]">{order.email}</span>
            </div>
            {order.customerName && (
              <div>
                <span className="text-[#a39e93] block text-[10px] uppercase">
                  Name
                </span>
                <span className="text-[#30261f]">{order.customerName}</span>
              </div>
            )}
            <div>
              <span className="text-[#a39e93] block text-[10px] uppercase">
                Surface
              </span>
              <span className="text-[#30261f] uppercase">{order.surface}</span>
            </div>
            {order.userId && (
              <div>
                <span className="text-[#a39e93] block text-[10px] uppercase">
                  Account ID
                </span>
                <Link
                  href={`${basePath}/customers/${order.userId}`}
                  className="text-[11px] text-[#706257] hover:text-[#30261f] hover:underline"
                >
                  {order.userId}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="border border-[#e5e0d8] bg-[#fffefc] p-5 rounded-[2px] space-y-3">
          <h3 className="admin-eyebrow">Shipping Address Snapshot</h3>
          <div className="text-xs text-[#706257] space-y-1">
            {order.shippingAddressSnapshot.full_name ||
            order.shippingAddressSnapshot.first_name ? (
              <>
                <p className="font-medium text-[#30261f]">
                  {order.shippingAddressSnapshot.full_name ||
                    `${order.shippingAddressSnapshot.first_name || ""} ${order.shippingAddressSnapshot.last_name || ""}`.trim()}
                </p>
                {order.shippingAddressSnapshot.company && (
                  <p>{String(order.shippingAddressSnapshot.company)}</p>
                )}
                <p>{String(order.shippingAddressSnapshot.address1 || "")}</p>
                {order.shippingAddressSnapshot.address2 && (
                  <p>{String(order.shippingAddressSnapshot.address2)}</p>
                )}
                <p>
                  {[
                    order.shippingAddressSnapshot.city,
                    order.shippingAddressSnapshot.state_abbr ||
                      order.shippingAddressSnapshot.state,
                    order.shippingAddressSnapshot.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shippingAddressSnapshot.country_iso ? (
                  <p>{String(order.shippingAddressSnapshot.country_iso)}</p>
                ) : null}
                {order.shippingAddressSnapshot.phone && (
                  <p className="text-[11px] mt-1 tabular-nums">
                    Phone: {String(order.shippingAddressSnapshot.phone)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[#a39e93]">No shipping address recorded</p>
            )}
          </div>
        </div>

        {/* Billing Address Snapshot */}
        <div className="border border-[#e5e0d8] bg-[#fffefc] p-5 rounded-[2px] space-y-3">
          <h3 className="admin-eyebrow">Billing Address Snapshot</h3>
          <div className="text-xs text-[#706257] space-y-1">
            {order.billingAddressSnapshot.full_name ||
            order.billingAddressSnapshot.first_name ? (
              <>
                <p className="font-medium text-[#30261f]">
                  {order.billingAddressSnapshot.full_name ||
                    `${order.billingAddressSnapshot.first_name || ""} ${order.billingAddressSnapshot.last_name || ""}`.trim()}
                </p>
                {order.billingAddressSnapshot.company && (
                  <p>{String(order.billingAddressSnapshot.company)}</p>
                )}
                <p>{String(order.billingAddressSnapshot.address1 || "")}</p>
                {order.billingAddressSnapshot.address2 && (
                  <p>{String(order.billingAddressSnapshot.address2)}</p>
                )}
                <p>
                  {[
                    order.billingAddressSnapshot.city,
                    order.billingAddressSnapshot.state_abbr ||
                      order.billingAddressSnapshot.state,
                    order.billingAddressSnapshot.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.billingAddressSnapshot.country_iso ? (
                  <p>{String(order.billingAddressSnapshot.country_iso)}</p>
                ) : null}
                {order.billingAddressSnapshot.phone && (
                  <p className="text-[11px] mt-1 tabular-nums">
                    Phone: {String(order.billingAddressSnapshot.phone)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[#a39e93]">Same as shipping address</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Totals Summary */}
      <div className="flex justify-end pt-4 border-t border-[#e5e0d8]">
        <div className="w-full max-w-xs space-y-2 text-xs">
          <div className="flex justify-between text-[#706257]">
            <span>Items Subtotal</span>
            <span className="tabular-nums">{formatMoney(order.subtotalInCents, order.currency)}</span>
          </div>
          <div className="flex justify-between text-[#706257]">
            <span>Estimated Tax</span>
            <span className="tabular-nums">{formatMoney(order.taxInCents, order.currency)}</span>
          </div>
          <div className="flex justify-between text-[#706257]">
            <span>Shipping</span>
            <span className="tabular-nums">
              {order.shippingInCents === 0
                ? "Free"
                : formatMoney(order.shippingInCents, order.currency)}
            </span>
          </div>
          <div className="border-t border-[#cfc4b6] pt-2 flex justify-between font-medium text-sm text-[#30261f]">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(order.totalInCents, order.currency)}</span>
          </div>
        </div>
      </div>

      {/* Technical Footnote & Invariants */}
      <div className="p-4 bg-[#f5f2ec] border border-[#e5e0d8] rounded-[2px] text-xs text-[#706257] space-y-1">
        <p className="font-medium text-[#30261f]">Immutable Historical Record</p>
        <p className="text-[11px] leading-relaxed">
          Order items and address snapshots are permanently fixed at checkout time.
          Payment capture, fulfillment, shipment management, refunds, and admin cancellation workflows are not implemented in the current Mirza commerce backend.
        </p>
        <div className="pt-2 text-[10px] text-[#a39e93] flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
          <span>Order ID: {order.id}</span>
          <span>Cart ID: {order.sourceCartId}</span>
          <span>Created: {order.createdAt.toISOString()}</span>
        </div>
      </div>
    </div>
  );
}
