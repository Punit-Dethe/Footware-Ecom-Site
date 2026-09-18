import "server-only";

import { query } from "./index";
import { getStoragePublicUrl } from "@/lib/media/delivery";

export interface ListAdminOrdersInput {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: "all" | "placed" | "cancelled";
  customerType?: "all" | "registered" | "guest";
  sort?: "newest" | "oldest" | "total_desc" | "total_asc";
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  status: "placed" | "cancelled";
  currency: string;
  totalInCents: number;
  surface: "dtc" | "wholesale";
  completedAt: Date;
  createdAt: Date;
  itemCount: number;
  totalUnits: number;
  isRegisteredCustomer: boolean;
}

export interface ListAdminOrdersResult {
  orders: AdminOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminOrderItemDetail {
  id: string;
  orderId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  sizeOption: string;
  priceInCents: number;
  quantity: number;
  totalInCents: number;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export interface AddressSnapshot {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company?: string | null;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  state_abbr?: string | null;
  postal_code?: string;
  country_iso?: string;
  phone?: string | null;
  [key: string]: unknown;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  status: "placed" | "cancelled";
  currency: string;
  subtotalInCents: number;
  taxInCents: number;
  shippingInCents: number;
  totalInCents: number;
  shippingAddressSnapshot: AddressSnapshot;
  billingAddressSnapshot: AddressSnapshot;
  sourceCartId: string;
  surface: "dtc" | "wholesale";
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isRegisteredCustomer: boolean;
  customerName: string | null;
  items: AdminOrderItemDetail[];
}

export interface ListAdminCustomersInput {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: "newest" | "oldest" | "latest_order" | "most_orders" | "highest_order_total";
}

export interface AdminCustomerListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: Date;
  orderCount: number;
  historicalOrderTotalInCents: number;
  latestOrderAt: Date | null;
  addressCount: number;
}

export interface ListAdminCustomersResult {
  customers: AdminCustomerListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminCustomerAddress {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  stateAbbr: string | null;
  postalCode: string;
  countryIso: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  status: "placed" | "cancelled";
  currency: string;
  totalInCents: number;
  surface: "dtc" | "wholesale";
  completedAt: Date;
  itemCount: number;
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: "customer";
  createdAt: Date;
  updatedAt: Date;
  addresses: AdminCustomerAddress[];
  orders: AdminCustomerOrderHistoryItem[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(val: string): boolean {
  return UUID_REGEX.test(val);
}

function resolveSnapshotThumbnail(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("/")) {
    return rawUrl;
  }
  // If it's a relative storage path (e.g. products/...), resolve via CDN public URL
  return getStoragePublicUrl(rawUrl);
}

/**
 * Lists paginated admin orders with bounded CTE query, 0 N+1, and URL filters.
 */
export async function listAdminOrdersPage(
  input: ListAdminOrdersInput = {},
): Promise<ListAdminOrdersResult> {
  const page = Math.max(1, input.page || 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize || 30));
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = ["1=1"];
  const params: unknown[] = [];

  if (input.query?.trim()) {
    params.push(`%${input.query.trim()}%`);
    const qIdx = params.length;
    whereClauses.push(
      `(o.order_number ILIKE $${qIdx} OR o.email ILIKE $${qIdx} OR o.id IN (SELECT order_id FROM public.order_items WHERE sku ILIKE $${qIdx}))`,
    );
  }

  if (input.status && input.status !== "all") {
    params.push(input.status);
    whereClauses.push(`o.status = $${params.length}`);
  }

  if (input.customerType === "registered") {
    whereClauses.push(`o.user_id IS NOT NULL`);
  } else if (input.customerType === "guest") {
    whereClauses.push(`o.user_id IS NULL`);
  }

  let rankedOrderBy = "fo.completed_at DESC, fo.id DESC";
  let outerOrderBy = "ro.completed_at DESC, ro.id DESC";

  if (input.sort === "oldest") {
    rankedOrderBy = "fo.completed_at ASC, fo.id ASC";
    outerOrderBy = "ro.completed_at ASC, ro.id ASC";
  } else if (input.sort === "total_desc") {
    rankedOrderBy = "fo.total_in_cents DESC, fo.completed_at DESC, fo.id DESC";
    outerOrderBy = "ro.total_in_cents DESC, ro.completed_at DESC, ro.id DESC";
  } else if (input.sort === "total_asc") {
    rankedOrderBy = "fo.total_in_cents ASC, fo.completed_at DESC, fo.id DESC";
    outerOrderBy = "ro.total_in_cents ASC, ro.completed_at DESC, ro.id DESC";
  }

  params.push(pageSize);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    WITH filtered_orders AS (
      SELECT
        o.id,
        o.order_number,
        o.user_id,
        o.email,
        o.status,
        o.currency,
        o.total_in_cents,
        o.surface,
        o.completed_at,
        o.created_at
      FROM public.orders o
      WHERE ${whereClauses.join(" AND ")}
    ),
    order_item_stats AS (
      SELECT
        oi.order_id,
        COUNT(oi.id)::int AS item_count,
        COALESCE(SUM(oi.quantity), 0)::int AS total_units
      FROM public.order_items oi
      JOIN filtered_orders fo ON fo.id = oi.order_id
      GROUP BY oi.order_id
    ),
    ranked_orders AS (
      SELECT
        fo.id,
        fo.order_number,
        fo.user_id,
        fo.email,
        fo.status,
        fo.currency,
        fo.total_in_cents,
        fo.surface,
        fo.completed_at,
        fo.created_at,
        COALESCE(ois.item_count, 0)::int AS item_count,
        COALESCE(ois.total_units, 0)::int AS total_units,
        (fo.user_id IS NOT NULL) AS is_registered_customer,
        COUNT(*) OVER()::int AS total_count
      FROM filtered_orders fo
      LEFT JOIN order_item_stats ois ON ois.order_id = fo.id
      ORDER BY ${rankedOrderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    )
    SELECT *
    FROM ranked_orders ro
    ORDER BY ${outerOrderBy};
  `;

  const res = await query<{
    id: string;
    order_number: string;
    user_id: string | null;
    email: string;
    status: "placed" | "cancelled";
    currency: string;
    total_in_cents: number;
    surface: "dtc" | "wholesale";
    completed_at: Date;
    created_at: Date;
    item_count: number;
    total_units: number;
    is_registered_customer: boolean;
    total_count: number;
  }>(sql, params);

  let totalCount = 0;
  if (res.rows.length > 0) {
    totalCount = Number(res.rows[0].total_count) || 0;
  } else if (offset > 0) {
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM public.orders o
      WHERE ${whereClauses.join(" AND ")};
    `;
    const countParams = params.slice(0, -2);
    const countRes = await query<{ count: number }>(countSql, countParams);
    totalCount = Number(countRes.rows[0]?.count) || 0;
  }

  const orders: AdminOrderListItem[] = res.rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    email: row.email,
    status: row.status,
    currency: row.currency || "USD",
    totalInCents: Number(row.total_in_cents),
    surface: row.surface || "dtc",
    completedAt: new Date(row.completed_at),
    createdAt: new Date(row.created_at),
    itemCount: Number(row.item_count || 0),
    totalUnits: Number(row.total_units || 0),
    isRegisteredCustomer: Boolean(row.is_registered_customer),
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    orders,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves full historical details for a single order in exactly 2 bounded SQL queries.
 */
export async function getAdminOrderDetail(
  idOrNumber: string,
): Promise<AdminOrderDetail | null> {
  const isUuid = isValidUuid(idOrNumber);

  const orderSql = `
    SELECT
      o.id,
      o.order_number,
      o.user_id,
      o.email,
      o.status,
      o.currency,
      o.subtotal_in_cents,
      o.tax_in_cents,
      o.shipping_in_cents,
      o.total_in_cents,
      o.shipping_address_snapshot,
      o.billing_address_snapshot,
      o.source_cart_id,
      o.surface,
      o.completed_at,
      o.created_at,
      o.updated_at,
      (o.user_id IS NOT NULL) AS is_registered_customer,
      p.first_name AS customer_first_name,
      p.last_name AS customer_last_name
    FROM public.orders o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    WHERE ${isUuid ? "o.id = $1" : "o.order_number = $1"}
    LIMIT 1;
  `;

  const orderRes = await query<{
    id: string;
    order_number: string;
    user_id: string | null;
    email: string;
    status: "placed" | "cancelled";
    currency: string;
    subtotal_in_cents: number;
    tax_in_cents: number;
    shipping_in_cents: number;
    total_in_cents: number;
    shipping_address_snapshot: unknown;
    billing_address_snapshot: unknown;
    source_cart_id: string;
    surface: "dtc" | "wholesale";
    completed_at: Date;
    created_at: Date;
    updated_at: Date;
    is_registered_customer: boolean;
    customer_first_name: string | null;
    customer_last_name: string | null;
  }>(orderSql, [idOrNumber]);

  const orderRow = orderRes.rows[0];
  if (!orderRow) {
    return null;
  }

  const itemsSql = `
    SELECT
      oi.id,
      oi.order_id,
      oi.variant_id,
      oi.product_name,
      oi.sku,
      oi.size_option,
      oi.price_in_cents,
      oi.quantity,
      oi.total_in_cents,
      oi.thumbnail_url,
      oi.created_at
    FROM public.order_items oi
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC, oi.id ASC;
  `;

  const itemsRes = await query<{
    id: string;
    order_id: string;
    variant_id: string | null;
    product_name: string;
    sku: string;
    size_option: string;
    price_in_cents: number;
    quantity: number;
    total_in_cents: number;
    thumbnail_url: string | null;
    created_at: Date;
  }>(itemsSql, [orderRow.id]);

  const shippingSnapshot: AddressSnapshot =
    typeof orderRow.shipping_address_snapshot === "string"
      ? JSON.parse(orderRow.shipping_address_snapshot)
      : (orderRow.shipping_address_snapshot as AddressSnapshot) || {};

  const billingSnapshot: AddressSnapshot =
    typeof orderRow.billing_address_snapshot === "string"
      ? JSON.parse(orderRow.billing_address_snapshot)
      : (orderRow.billing_address_snapshot as AddressSnapshot) || {};

  const customerName = [orderRow.customer_first_name, orderRow.customer_last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || null;

  const items: AdminOrderItemDetail[] = itemsRes.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    variantId: row.variant_id,
    productName: row.product_name,
    sku: row.sku,
    sizeOption: row.size_option,
    priceInCents: Number(row.price_in_cents),
    quantity: Number(row.quantity),
    totalInCents: Number(row.total_in_cents),
    thumbnailUrl: resolveSnapshotThumbnail(row.thumbnail_url),
    createdAt: new Date(row.created_at),
  }));

  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    userId: orderRow.user_id,
    email: orderRow.email,
    status: orderRow.status,
    currency: orderRow.currency || "USD",
    subtotalInCents: Number(orderRow.subtotal_in_cents),
    taxInCents: Number(orderRow.tax_in_cents || 0),
    shippingInCents: Number(orderRow.shipping_in_cents || 0),
    totalInCents: Number(orderRow.total_in_cents),
    shippingAddressSnapshot: shippingSnapshot,
    billingAddressSnapshot: billingSnapshot,
    sourceCartId: orderRow.source_cart_id,
    surface: orderRow.surface || "dtc",
    completedAt: new Date(orderRow.completed_at),
    createdAt: new Date(orderRow.created_at),
    updatedAt: new Date(orderRow.updated_at),
    isRegisteredCustomer: Boolean(orderRow.is_registered_customer),
    customerName,
    items,
  };
}

/**
 * Lists paginated customer profiles with order aggregates and address counts.
 * Strictly bounded to role='customer' (excludes administrator accounts).
 */
export async function listAdminCustomersPage(
  input: ListAdminCustomersInput = {},
): Promise<ListAdminCustomersResult> {
  const page = Math.max(1, input.page || 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize || 30));
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = ["p.role = 'customer'"];
  const params: unknown[] = [];

  if (input.query?.trim()) {
    params.push(`%${input.query.trim()}%`);
    const qIdx = params.length;
    whereClauses.push(
      `(u.email ILIKE $${qIdx} OR p.first_name ILIKE $${qIdx} OR p.last_name ILIKE $${qIdx} OR p.phone ILIKE $${qIdx})`,
    );
  }

  let rankedOrderBy = "cp.created_at DESC, cp.id DESC";
  let outerOrderBy = "rc.created_at DESC, rc.id DESC";

  if (input.sort === "oldest") {
    rankedOrderBy = "cp.created_at ASC, cp.id ASC";
    outerOrderBy = "rc.created_at ASC, rc.id ASC";
  } else if (input.sort === "latest_order") {
    rankedOrderBy = "cos.latest_order_at DESC NULLS LAST, cp.created_at DESC";
    outerOrderBy = "rc.latest_order_at DESC NULLS LAST, rc.created_at DESC";
  } else if (input.sort === "most_orders") {
    rankedOrderBy = "COALESCE(cos.order_count, 0) DESC, cp.created_at DESC";
    outerOrderBy = "rc.order_count DESC, rc.created_at DESC";
  } else if (input.sort === "highest_order_total") {
    rankedOrderBy = "COALESCE(cos.historical_order_total_in_cents, 0) DESC, cp.created_at DESC";
    outerOrderBy = "rc.historical_order_total_in_cents DESC, rc.created_at DESC";
  }

  params.push(pageSize);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    WITH customer_profiles AS (
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.phone,
        p.role,
        p.created_at,
        u.email
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE ${whereClauses.join(" AND ")}
    ),
    customer_order_stats AS (
      SELECT
        o.user_id,
        COUNT(o.id)::int AS order_count,
        COALESCE(SUM(o.total_in_cents), 0)::bigint AS historical_order_total_in_cents,
        MAX(o.completed_at) AS latest_order_at
      FROM public.orders o
      JOIN customer_profiles cp ON cp.id = o.user_id
      GROUP BY o.user_id
    ),
    customer_address_stats AS (
      SELECT
        a.user_id,
        COUNT(a.id)::int AS address_count
      FROM public.addresses a
      JOIN customer_profiles cp ON cp.id = a.user_id
      GROUP BY a.user_id
    ),
    ranked_customers AS (
      SELECT
        cp.id,
        cp.email,
        cp.first_name,
        cp.last_name,
        cp.phone,
        cp.created_at,
        COALESCE(cos.order_count, 0)::int AS order_count,
        COALESCE(cos.historical_order_total_in_cents, 0)::bigint AS historical_order_total_in_cents,
        cos.latest_order_at,
        COALESCE(cas.address_count, 0)::int AS address_count,
        COUNT(*) OVER()::int AS total_count
      FROM customer_profiles cp
      LEFT JOIN customer_order_stats cos ON cos.user_id = cp.id
      LEFT JOIN customer_address_stats cas ON cas.user_id = cp.id
      ORDER BY ${rankedOrderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    )
    SELECT *
    FROM ranked_customers rc
    ORDER BY ${outerOrderBy};
  `;

  const res = await query<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: Date;
    order_count: number;
    historical_order_total_in_cents: string | number;
    latest_order_at: Date | null;
    address_count: number;
    total_count: number;
  }>(sql, params);

  let totalCount = 0;
  if (res.rows.length > 0) {
    totalCount = Number(res.rows[0].total_count) || 0;
  } else if (offset > 0) {
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE ${whereClauses.join(" AND ")};
    `;
    const countParams = params.slice(0, -2);
    const countRes = await query<{ count: number }>(countSql, countParams);
    totalCount = Number(countRes.rows[0]?.count) || 0;
  }

  const customers: AdminCustomerListItem[] = res.rows.map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    orderCount: Number(row.order_count || 0),
    historicalOrderTotalInCents: Number(row.historical_order_total_in_cents || 0),
    latestOrderAt: row.latest_order_at ? new Date(row.latest_order_at) : null,
    addressCount: Number(row.address_count || 0),
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    customers,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves detailed customer information, saved addresses, and bounded order history.
 * Bound to user_id strictly. Zero N+1 queries.
 */
export async function getAdminCustomerDetail(
  customerId: string,
): Promise<AdminCustomerDetail | null> {
  if (!isValidUuid(customerId)) {
    return null;
  }

  const profileSql = `
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.phone,
      p.role,
      p.created_at,
      p.updated_at,
      u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = $1 AND p.role = 'customer'
    LIMIT 1;
  `;

  const profileRes = await query<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: "customer";
    created_at: Date;
    updated_at: Date;
    email: string;
  }>(profileSql, [customerId]);

  const profile = profileRes.rows[0];
  if (!profile) {
    return null;
  }

  const addressesSql = `
    SELECT
      id,
      user_id,
      first_name,
      last_name,
      company,
      address1,
      address2,
      city,
      state,
      state_abbr,
      postal_code,
      country_iso,
      phone,
      is_default_shipping,
      is_default_billing,
      created_at,
      updated_at
    FROM public.addresses
    WHERE user_id = $1
    ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at ASC;
  `;

  const addressesRes = await query<{
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    state_abbr: string | null;
    postal_code: string;
    country_iso: string;
    phone: string | null;
    is_default_shipping: boolean;
    is_default_billing: boolean;
    created_at: Date;
    updated_at: Date;
  }>(addressesSql, [customerId]);

  const addresses: AdminCustomerAddress[] = addressesRes.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    state: row.state,
    stateAbbr: row.state_abbr,
    postalCode: row.postal_code,
    countryIso: row.country_iso,
    phone: row.phone,
    isDefaultShipping: Boolean(row.is_default_shipping),
    isDefaultBilling: Boolean(row.is_default_billing),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));

  const ordersSql = `
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.currency,
      o.total_in_cents,
      o.surface,
      o.completed_at,
      COALESCE(COUNT(oi.id), 0)::int AS item_count
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.completed_at DESC
    LIMIT 50;
  `;

  const ordersRes = await query<{
    id: string;
    order_number: string;
    status: "placed" | "cancelled";
    currency: string;
    total_in_cents: number;
    surface: "dtc" | "wholesale";
    completed_at: Date;
    item_count: number;
  }>(ordersSql, [customerId]);

  const orders: AdminCustomerOrderHistoryItem[] = ordersRes.rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    currency: row.currency || "USD",
    totalInCents: Number(row.total_in_cents),
    surface: row.surface || "dtc",
    completedAt: new Date(row.completed_at),
    itemCount: Number(row.item_count),
  }));

  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    role: "customer",
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
    addresses,
    orders,
  };
}
