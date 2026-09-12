import type { Address, Cart, Order } from "@spree/sdk";
import { COUNTRIES } from "@/lib/catalog/store-config";
import type { DbOrder, DbOrderItem } from "@/lib/db/order";

function adaptAddressSnapshot(raw: Record<string, unknown> | null | undefined): Address {
  if (!raw || typeof raw !== "object") {
    return {
      id: "addr_empty",
      first_name: "",
      last_name: "",
      full_name: "",
      company: null,
      address1: "",
      address2: null,
      city: "",
      postal_code: "",
      phone: null,
      country_iso: "US",
      country_name: "United States",
      state_abbr: "",
      state_name: "",
      state_text: "",
      quick_checkout: false,
      is_default_shipping: false,
      is_default_billing: false,
    } as unknown as Address;
  }

  const firstName = (raw.first_name as string) || "";
  const lastName = (raw.last_name as string) || "";
  const fullName =
    (raw.full_name as string) ||
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const countryIso = ((raw.country_iso as string) || "US").toUpperCase();

  let countryName = (raw.country_name as string) ||
    COUNTRIES.find((c) => c.iso.toUpperCase() === countryIso)?.name;
  if (!countryName) {
    try {
      countryName =
        new Intl.DisplayNames(["en"], { type: "region" }).of(countryIso) ||
        countryIso;
    } catch {
      countryName = countryIso;
    }
  }

  const state = (raw.state as string) || (raw.state_name as string) || "";
  const stateAbbr =
    (raw.state_abbr as string) ||
    COUNTRIES.find((c) => c.iso.toUpperCase() === countryIso)?.states?.find(
      (s) =>
        s.name.toLowerCase() === state.toLowerCase() ||
        s.abbr.toLowerCase() === state.toLowerCase(),
    )?.abbr ||
    state;

  return {
    id: (raw.id as string) || "addr_snapshot",
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    company: (raw.company as string) || null,
    address1: (raw.address1 as string) || "",
    address2: (raw.address2 as string) || null,
    city: (raw.city as string) || "",
    postal_code: (raw.postal_code as string) || "",
    phone: (raw.phone as string) || null,
    country_iso: countryIso,
    country_name: countryName,
    state_abbr: stateAbbr,
    state_name: state,
    state_text: stateAbbr || state,
    quick_checkout: false,
    is_default_shipping: Boolean(raw.is_default_shipping),
    is_default_billing: Boolean(raw.is_default_billing),
  } as unknown as Address;
}

/**
 * Pure synchronous adapter converting DbOrder + DbOrderItem[] into the
 * Spree SDK Order / Cart compatibility shape consumed by UI components.
 */
export function adaptDbOrderToSpree(
  order: DbOrder,
  items: DbOrderItem[] = [],
): Order {
  const subtotalCents = order.subtotal_in_cents;
  const shippingCents = order.shipping_in_cents;
  const taxCents = order.tax_in_cents;
  const totalCents = order.total_in_cents;

  const displayItemTotal = `$${(subtotalCents / 100).toFixed(2)}`;
  const displayDeliveryTotal = `$${(shippingCents / 100).toFixed(2)}`;
  const displayTaxTotal = `$${(taxCents / 100).toFixed(2)}`;
  const displayDiscountTotal = "$0.00";
  const displayTotal = `$${(totalCents / 100).toFixed(2)}`;

  const adaptedItems = items.map((item) => {
    let slug = item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const matchOff = item.sku.match(/^MIRZA-OFF-(\d+)/);
    if (matchOff) {
      slug = `office-footwear-${String(Number(matchOff[1])).padStart(2, "0")}`;
    } else {
      const matchTrd = item.sku.match(/^MIRZA-TRD-(\d+)/);
      if (matchTrd) {
        slug = `traditional-footwear-${String(Number(matchTrd[1])).padStart(2, "0")}`;
      }
    }
    const displayPrice = `$${(item.price_in_cents / 100).toFixed(2)}`;
    const displayLineTotal = `$${(item.total_in_cents / 100).toFixed(2)}`;

    return {
      id: item.id,
      name: item.product_name,
      slug,
      sku: item.sku,
      variant_id: item.variant_id || item.sku,
      quantity: item.quantity,
      price: {
        amount: (item.price_in_cents / 100).toFixed(2),
        currency: order.currency,
        display_amount: displayPrice,
        amount_in_cents: item.price_in_cents,
      },
      display_price: displayPrice,
      total: {
        amount_in_cents: item.total_in_cents,
        display_amount: displayLineTotal,
      },
      display_total: displayLineTotal,
      thumbnail_url: item.thumbnail_url ?? null,
      options_text: item.size_option ? `Size: ${item.size_option}` : null,
    };
  });

  const shippingAddress = adaptAddressSnapshot(order.shipping_address_snapshot);
  const billingAddress = adaptAddressSnapshot(order.billing_address_snapshot);

  return {
    id: order.id,
    number: order.order_number,
    token: `order_${order.id}`,
    email: order.email,
    currency: order.currency,
    status: order.status,
    payment_status: null,
    fulfillment_status: null,
    item_total: (subtotalCents / 100).toFixed(2),
    display_item_total: displayItemTotal,
    delivery_total: (shippingCents / 100).toFixed(2),
    display_delivery_total: displayDeliveryTotal,
    tax_total: (taxCents / 100).toFixed(2),
    display_tax_total: displayTaxTotal,
    discount_total: "0.00",
    display_discount_total: displayDiscountTotal,
    total: (totalCents / 100).toFixed(2),
    display_total: displayTotal,
    completed_at: order.completed_at.toISOString(),
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    items: adaptedItems,
    shipping_address: shippingAddress,
    billing_address: billingAddress,
    payments: [],
    fulfillments: [],
  } as unknown as Order;
}

/**
 * Adapter specifically for Cart compatibility when an order is requested via getCheckoutOrder / getCompletedOrder.
 */
export function adaptDbOrderToCart(
  order: DbOrder,
  items: DbOrderItem[] = [],
): Cart {
  const spreeOrder = adaptDbOrderToSpree(order, items);
  return {
    ...spreeOrder,
    current_step: "complete",
    total_quantity: items.reduce((acc, i) => acc + i.quantity, 0),
  } as unknown as Cart;
}
