import "server-only";

import { createElement } from "react";
import { after } from "next/server";
import type { DbOrder, DbOrderItem } from "@/lib/db/order";
import { sendEmail, type SendEmailResult } from "@/lib/emails/send";
import {
  OrderConfirmationEmail,
  type OrderConfirmationLineItem,
  type OrderConfirmationAddress,
} from "@/lib/emails/order-confirmation";

export interface OrderConfirmationData {
  order: DbOrder;
  items: DbOrderItem[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Maps raw database snapshots into email-safe address structures.
 */
function mapAddressSnapshot(
  raw: Record<string, unknown> | null | undefined,
): OrderConfirmationAddress | undefined {
  if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) {
    return undefined;
  }

  const firstName = (raw.first_name as string) || "";
  const lastName = (raw.last_name as string) || "";
  const fullName =
    (raw.full_name as string) ||
    [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    full_name: fullName || undefined,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    address1: (raw.address1 as string) || undefined,
    address2: (raw.address2 as string) || undefined,
    city: (raw.city as string) || undefined,
    state_text:
      (raw.state_abbr as string) ||
      (raw.state as string) ||
      (raw.state_name as string) ||
      undefined,
    postal_code: (raw.postal_code as string) || undefined,
    country_name: (raw.country_name as string) || (raw.country_iso as string) || undefined,
    phone: (raw.phone as string) || undefined,
  };
}

/**
 * Prepares props for the OrderConfirmationEmail component from DbOrder and DbOrderItem[].
 */
export function buildOrderConfirmationEmailProps(data: OrderConfirmationData) {
  const { order, items } = data;

  const shipping = mapAddressSnapshot(order.shipping_address_snapshot);
  const billing = mapAddressSnapshot(order.billing_address_snapshot);

  const emailPrefix =
    typeof order.email === "string" && order.email.includes("@")
      ? order.email.split("@")[0]
      : "Customer";

  const customerName =
    shipping?.full_name ||
    [shipping?.first_name, shipping?.last_name].filter(Boolean).join(" ") ||
    emailPrefix;

  const emailItems: OrderConfirmationLineItem[] = items.map((item) => {
    let slug = item.product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const matchOff = item.sku.match(/^MIRZA-OFF-(\d+)/);
    if (matchOff) {
      slug = `office-footwear-${String(Number(matchOff[1])).padStart(2, "0")}`;
    } else {
      const matchTrd = item.sku.match(/^MIRZA-TRD-(\d+)/);
      if (matchTrd) {
        slug = `traditional-footwear-${String(Number(matchTrd[1])).padStart(2, "0")}`;
      }
    }

    return {
      name: item.product_name,
      slug,
      quantity: item.quantity,
      options_text: item.size_option ? `Size: ${item.size_option}` : undefined,
      display_price: formatCents(item.price_in_cents),
      display_total: formatCents(item.total_in_cents),
      thumbnail_url: item.thumbnail_url,
    };
  });

  const orderDate = new Date(order.completed_at || order.created_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  return {
    orderNumber: order.order_number,
    customerName,
    items: emailItems,
    displayItemTotal: formatCents(order.subtotal_in_cents),
    displayDeliveryTotal:
      order.shipping_in_cents === 0
        ? "Complimentary"
        : formatCents(order.shipping_in_cents),
    displayTaxTotal: formatCents(order.tax_in_cents),
    displayTotal: formatCents(order.total_in_cents),
    shippingAddress: shipping,
    billingAddress: billing,
    orderDate,
  };
}

/**
 * Sends order confirmation email safely with idempotency protection.
 * Catches all errors and returns a structured result without throwing.
 */
export async function sendOrderConfirmationEmailSafe(
  data: OrderConfirmationData,
): Promise<SendEmailResult> {
  const { order } = data;

  try {
    const emailProps = buildOrderConfirmationEmailProps(data);
    const subject = `Your Mirza order is confirmed — ${order.order_number}`;
    const idempotencyKey = `order-confirmation/${order.id}`;

    const reactElement = createElement(OrderConfirmationEmail, emailProps);

    const targetEmail =
      order.email ||
      (order as unknown as Record<string, unknown>).checkout_email as string ||
      "customer@example.com";

    const result = await sendEmail({
      to: targetEmail,
      subject,
      react: reactElement,
      idempotencyKey,
    });

    if (!result.success) {
      console.warn(
        `[email:order-confirmation] Delivery returned failure for order ${order.order_number}:`,
        result.error,
      );
    } else {
      console.log(
        `[email:order-confirmation] Confirmation delivered for order ${order.order_number} (id: ${result.id ?? "n/a"})`,
      );
    }

    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[email:order-confirmation] Unexpected error sending confirmation for order ${order.order_number}:`,
      errorMsg,
    );
    return { success: false, error: errorMsg };
  }
}

/**
 * Schedules order confirmation email in a post-response task using Next.js after().
 * Ensures that email sending latency and potential failures never block or fail checkout.
 */
export function scheduleOrderConfirmationEmail(data: OrderConfirmationData): void {
  try {
    after(async () => {
      await sendOrderConfirmationEmailSafe(data);
    });
  } catch {
    // If called outside a Next.js request scope (e.g. CLI script or unit tests),
    // trigger safely in the background without blocking execution
    void sendOrderConfirmationEmailSafe(data).catch(() => {});
  }
}
