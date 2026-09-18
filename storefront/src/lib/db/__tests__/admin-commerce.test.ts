import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../index", () => ({
  query: mockDb.query,
}));

import {
  getAdminCustomerDetail,
  getAdminOrderDetail,
  listAdminCustomersPage,
  listAdminOrdersPage,
} from "../admin-commerce";

const TEST_ORDER_ID = "33333333-3333-4333-8333-333333333333";
const TEST_USER_ID = "44444444-4444-4444-8444-444444444444";

describe("Admin Commerce Phase 8 DAL Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listAdminOrdersPage", () => {
    it("executes single bounded query with default pagination and maps order list items", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ORDER_ID,
            order_number: "MRZ-TEST123456",
            user_id: TEST_USER_ID,
            email: "shoelover@example.com",
            status: "placed",
            currency: "USD",
            total_in_cents: 28500,
            surface: "dtc",
            completed_at: new Date("2026-09-18T10:00:00Z"),
            created_at: new Date("2026-09-18T09:55:00Z"),
            item_count: 2,
            total_units: 3,
            is_registered_customer: true,
            total_count: 42,
          },
        ],
      });

      const result = await listAdminOrdersPage({
        page: 1,
        pageSize: 30,
        query: "MRZ-TEST",
        status: "placed",
        customerType: "registered",
        sort: "newest",
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];

      // Check query parameters
      expect(params).toContain("%MRZ-TEST%");
      expect(params).toContain("placed");
      expect(params).toContain(30); // limit
      expect(params).toContain(0); // offset

      // Check SQL structure
      expect(sql).toContain("o.user_id IS NOT NULL");
      expect(sql).toContain("order_item_stats");
      expect(sql).toContain("COUNT(*) OVER()::int AS total_count");

      // Verify mapped items
      expect(result.totalCount).toBe(42);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe("MRZ-TEST123456");
      expect(result.orders[0].totalInCents).toBe(28500);
      expect(result.orders[0].itemCount).toBe(2);
      expect(result.orders[0].totalUnits).toBe(3);
      expect(result.orders[0].isRegisteredCustomer).toBe(true);
    });

    it("falls back to count query if offset exceeds row count on deep page", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 15 }] });

      const result = await listAdminOrdersPage({
        page: 4,
        pageSize: 30,
      });

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.orders).toHaveLength(0);
      expect(result.totalCount).toBe(15);
      expect(result.page).toBe(4);
    });
  });

  describe("getAdminOrderDetail", () => {
    it("returns null if order is not found", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const order = await getAdminOrderDetail("nonexistent-order");
      expect(order).toBeNull();
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("executes exactly 2 bounded queries and preserves immutable snapshots", async () => {
      // 1. Order row
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ORDER_ID,
            order_number: "MRZ-TEST123456",
            user_id: TEST_USER_ID,
            email: "shoelover@example.com",
            status: "placed",
            currency: "USD",
            subtotal_in_cents: 25000,
            tax_in_cents: 2000,
            shipping_in_cents: 1500,
            total_in_cents: 28500,
            shipping_address_snapshot: {
              first_name: "Jane",
              last_name: "Doe",
              address1: "123 Shoe Lane",
              city: "New York",
              state: "NY",
              postal_code: "10001",
              country_iso: "US",
            },
            billing_address_snapshot: {
              first_name: "Jane",
              last_name: "Doe",
              address1: "123 Shoe Lane",
              city: "New York",
              state: "NY",
              postal_code: "10001",
              country_iso: "US",
            },
            source_cart_id: "55555555-5555-5555-5555-555555555555",
            surface: "dtc",
            completed_at: new Date("2026-09-18T10:00:00Z"),
            created_at: new Date("2026-09-18T09:55:00Z"),
            updated_at: new Date("2026-09-18T10:00:00Z"),
            is_registered_customer: true,
            customer_first_name: "Jane",
            customer_last_name: "Doe",
          },
        ],
      });

      // 2. Order items
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: "66666666-6666-6666-6666-666666666666",
            order_id: TEST_ORDER_ID,
            variant_id: "77777777-7777-7777-7777-777777777777",
            product_name: "The Sovereign Wholecut Oxford",
            sku: "SHOE-001-42",
            size_option: "42",
            price_in_cents: 25000,
            quantity: 1,
            total_in_cents: 25000,
            thumbnail_url: "products/prod-1/hero.webp",
            created_at: new Date("2026-09-18T10:00:00Z"),
          },
        ],
      });

      const order = await getAdminOrderDetail(TEST_ORDER_ID);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(order).not.toBeNull();
      expect(order?.orderNumber).toBe("MRZ-TEST123456");
      expect(order?.customerName).toBe("Jane Doe");
      expect(order?.shippingAddressSnapshot.address1).toBe("123 Shoe Lane");
      expect(order?.items).toHaveLength(1);
      expect(order?.items[0].productName).toBe("The Sovereign Wholecut Oxford");
      expect(order?.items[0].thumbnailUrl).toContain("products/prod-1/hero.webp");
    });
  });

  describe("listAdminCustomersPage", () => {
    it("strictly filters for role='customer', separates currencies, excludes cancelled from value, and joins auth.users without N+1", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_USER_ID,
            email: "shoelover@example.com",
            first_name: "Jane",
            last_name: "Doe",
            phone: "+1234567890",
            created_at: new Date("2026-09-01T12:00:00Z"),
            order_count: 5, // 5 total orders (placed + cancelled)
            placed_order_count: 4, // 4 placed orders
            placed_order_totals: [
              { currency: "EUR", totalInCents: 15000 },
              { currency: "USD", totalInCents: 60000 },
            ],
            latest_order_at: new Date("2026-09-18T10:00:00Z"),
            address_count: 2,
            total_count: 18,
          },
        ],
      });

      const result = await listAdminCustomersPage({
        page: 1,
        pageSize: 30,
        query: "shoelover",
        sort: "most_orders",
      });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];

      expect(sql).toContain("p.role = 'customer'");
      expect(sql).toContain("JOIN auth.users u ON u.id = p.id");
      expect(sql).toContain("customer_currency_totals");
      expect(sql).toContain("sub_o.status = 'placed'");
      expect(params).toContain("%shoelover%");

      expect(result.totalCount).toBe(18);
      expect(result.customers).toHaveLength(1);
      const c = result.customers[0];
      expect(c.email).toBe("shoelover@example.com");
      // Total order count includes all records
      expect(c.orderCount).toBe(5);
      // Placed order count only counts placed
      expect(c.placedOrderCount).toBe(4);
      // Currencies are kept strictly separated (never summed together)
      expect(c.placedOrderTotals).toHaveLength(2);
      expect(c.placedOrderTotals[0]).toEqual({ currency: "EUR", totalInCents: 15000 });
      expect(c.placedOrderTotals[1]).toEqual({ currency: "USD", totalInCents: 60000 });
      expect(c.addressCount).toBe(2);
    });

    it("falls back to count query if offset exceeds row count on deep customer page", async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: 12 }] });

      const result = await listAdminCustomersPage({
        page: 5,
        pageSize: 30,
      });

      // Normal = 1, worst case on out-of-range deep page = 2
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.customers).toHaveLength(0);
      expect(result.totalCount).toBe(12);
      expect(result.page).toBe(5);
    });
  });

  describe("getAdminCustomerDetail", () => {
    it("returns null for non-UUID customer ID", async () => {
      const customer = await getAdminCustomerDetail("invalid-uuid");
      expect(customer).toBeNull();
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it("executes exactly 3 bounded queries: computes full-history aggregates independent of bounded 50 rows", async () => {
      // 1. Profile + Auth + Full History SQL Aggregates
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_USER_ID,
            first_name: "Jane",
            last_name: "Doe",
            phone: "+1234567890",
            role: "customer",
            created_at: new Date("2026-09-01T12:00:00Z"),
            updated_at: new Date("2026-09-10T12:00:00Z"),
            email: "shoelover@example.com",
            total_order_count: 85, // 85 total orders in full history
            placed_order_count: 80, // 80 placed orders in full history
            latest_order_at: new Date("2026-09-18T10:00:00Z"),
            placed_order_totals: [
              { currency: "GBP", totalInCents: 120000 },
              { currency: "USD", totalInCents: 1540000 },
            ],
          },
        ],
      });

      // 2. Addresses
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: "88888888-8888-8888-8888-888888888888",
            user_id: TEST_USER_ID,
            first_name: "Jane",
            last_name: "Doe",
            company: null,
            address1: "123 Shoe Lane",
            address2: null,
            city: "New York",
            state: "New York",
            state_abbr: "NY",
            postal_code: "10001",
            country_iso: "US",
            phone: null,
            is_default_shipping: true,
            is_default_billing: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      // 3. Orders history strictly by user_id bounded to LIMIT 50
      // Array has only 2 rows here (or up to 50 in real DB)
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ORDER_ID,
            order_number: "MRZ-TEST123456",
            status: "placed",
            currency: "USD",
            total_in_cents: 28500,
            surface: "dtc",
            completed_at: new Date("2026-09-18T10:00:00Z"),
            item_count: 2,
          },
          {
            id: "55555555-5555-5555-5555-555555555555",
            order_number: "MRZ-TEST789012",
            status: "cancelled",
            currency: "USD",
            total_in_cents: 15000,
            surface: "dtc",
            completed_at: new Date("2026-09-17T10:00:00Z"),
            item_count: 1,
          },
        ],
      });

      const customer = await getAdminCustomerDetail(TEST_USER_ID);

      // Exactly 3 bounded queries (<= 3 queries)
      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(customer).not.toBeNull();
      expect(customer?.email).toBe("shoelover@example.com");
      expect(customer?.role).toBe("customer");

      // Verifies >50 order aggregates are from SQL, NOT derived from bounded orders array
      expect(customer?.totalOrderCount).toBe(85);
      expect(customer?.placedOrderCount).toBe(80);
      expect(customer?.orders).toHaveLength(2); // bounded rows

      // Verifies placedOrderTotals are grouped by currency
      expect(customer?.placedOrderTotals).toEqual([
        { currency: "GBP", totalInCents: 120000 },
        { currency: "USD", totalInCents: 1540000 },
      ]);

      // Verify Query 1 SQL contains currency grouping and status='placed' filter
      const profileSql = String(mockDb.query.mock.calls[0][0]);
      expect(profileSql).toContain("placed_order_totals");
      expect(profileSql).toContain("sub_o.status = 'placed'");

      // Verify Query 2 strictly bounded addresses query with LIMIT 100
      const addressesSql = String(mockDb.query.mock.calls[1][0]);
      expect(addressesSql).toContain("public.addresses");
      expect(addressesSql).toContain("LIMIT 100");

      // Verify Query 3 strictly used orders.user_id = $1
      const orderHistorySql = String(mockDb.query.mock.calls[2][0]);
      expect(orderHistorySql).toContain("o.user_id = $1");
      expect(orderHistorySql).toContain("LIMIT 50");
      expect(orderHistorySql).not.toContain("o.email");
    });
  });

  describe("Order & Address Integrity Invariants", () => {
    it("proves order total cross-currency sort options (total_desc, total_asc) no longer exist and DAL falls back to completed_at DESC in SQL", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // @ts-expect-error - testing runtime rejection of removed total_desc sort
      await listAdminOrdersPage({ sort: "total_desc" });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.query.mock.calls[0];
      expect(sql).not.toContain("ORDER BY fo.total_in_cents");
      expect(sql).not.toContain("ORDER BY ro.total_in_cents");
      expect(sql).toContain("fo.completed_at DESC, fo.id DESC");
    });

    it("proves total_asc is also rejected and falls back to newest sort in SQL", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // @ts-expect-error - testing runtime rejection of removed total_asc sort
      await listAdminOrdersPage({ sort: "total_asc" });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.query.mock.calls[0];
      expect(sql).not.toContain("ORDER BY fo.total_in_cents");
      expect(sql).not.toContain("ORDER BY ro.total_in_cents");
      expect(sql).toContain("fo.completed_at DESC, fo.id DESC");
    });

    it("passes through stored order currency (e.g. JPY, EUR, GBP) unchanged without defaulting to USD", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_ORDER_ID,
            order_number: "MRZ-TESTJPY",
            user_id: TEST_USER_ID,
            email: "shoelover@example.com",
            status: "placed",
            currency: "JPY",
            total_in_cents: 28500,
            surface: "dtc",
            completed_at: new Date("2026-09-18T10:00:00Z"),
            created_at: new Date("2026-09-18T09:55:00Z"),
            item_count: 1,
            total_units: 1,
            is_registered_customer: true,
            total_count: 1,
          },
        ],
      });

      const res = await listAdminOrdersPage({ page: 1, pageSize: 30 });
      expect(res.orders[0].currency).toBe("JPY");
    });

    it("preserves missing address snapshot country without fabricating US", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: TEST_ORDER_ID,
              order_number: "MRZ-TEST123456",
              user_id: TEST_USER_ID,
              email: "shoelover@example.com",
              status: "placed",
              currency: "GBP",
              subtotal_in_cents: 25000,
              tax_in_cents: 0,
              shipping_in_cents: 0,
              total_in_cents: 25000,
              shipping_address_snapshot: {
                first_name: "Sherlock",
                last_name: "Holmes",
                address1: "221B Baker St",
                city: "London",
                postal_code: "NW1 6XE",
                // country_iso omitted
              },
              billing_address_snapshot: {
                first_name: "Sherlock",
                last_name: "Holmes",
                address1: "221B Baker St",
                city: "London",
                postal_code: "NW1 6XE",
                // country_iso omitted
              },
              source_cart_id: null,
              surface: "dtc",
              completed_at: new Date("2026-09-18T10:00:00Z"),
              created_at: new Date("2026-09-18T09:55:00Z"),
              updated_at: new Date("2026-09-18T10:00:00Z"),
              is_registered_customer: true,
              customer_first_name: "Sherlock",
              customer_last_name: "Holmes",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const order = await getAdminOrderDetail(TEST_ORDER_ID);
      expect(order).not.toBeNull();
      expect(order?.currency).toBe("GBP");
      expect(order?.shippingAddressSnapshot.country_iso).toBeUndefined();
      expect(order?.billingAddressSnapshot.country_iso).toBeUndefined();
    });
  });

  describe("Customer Currency & Value Invariants", () => {
    it("proves highest_order_total is not accepted and falls back to default newest sort in SQL", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // @ts-expect-error - testing runtime rejection of removed invalid sort
      await listAdminCustomersPage({ sort: "highest_order_total" });

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql] = mockDb.query.mock.calls[0];
      // Must NOT sort by historical order total
      expect(sql).not.toContain("COALESCE(cos.historical_order_total_in_cents, 0) DESC");
      // Falls back to safe newest sort (created_at DESC)
      expect(sql).toContain("cp.created_at DESC, cp.id DESC");
    });

    it("rejects and skips malformed customer currency aggregate items without relabeling as USD", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_USER_ID,
            email: "shoelover@example.com",
            first_name: "Jane",
            last_name: "Doe",
            phone: "+1234567890",
            created_at: new Date("2026-09-01T12:00:00Z"),
            order_count: 2,
            placed_order_count: 2,
            placed_order_totals: [
              { currency: "", totalInCents: 5000 }, // empty currency -> skipped
              { currency: null, totalInCents: 4000 }, // null currency -> skipped
              { totalInCents: 3000 }, // missing currency -> skipped
              { currency: "EUR", totalInCents: 15000 }, // valid -> kept
            ],
            latest_order_at: new Date("2026-09-18T10:00:00Z"),
            address_count: 1,
            total_count: 1,
          },
        ],
      });

      const res = await listAdminCustomersPage({ page: 1, pageSize: 30 });
      expect(res.customers[0].placedOrderTotals).toHaveLength(1);
      expect(res.customers[0].placedOrderTotals[0]).toEqual({ currency: "EUR", totalInCents: 15000 });
    });

    it("verifies multi-currency placedOrderTotals format accurately without assuming USD", async () => {
      const { formatMoney } = await import("@/lib/utils/format");

      const totals = [
        { currency: "EUR", totalInCents: 12550 },
        { currency: "INR", totalInCents: 850000 },
        { currency: "USD", totalInCents: 24000 },
      ];

      const formatted = totals.map((t) => formatMoney(t.totalInCents, t.currency));

      // EUR formatting contains € or EUR (non-USD)
      expect(formatted[0]).toMatch(/€|EUR/);
      expect(formatted[0]).toContain("125.50");

      // INR formatting contains ₹ or INR (non-USD)
      expect(formatted[1]).toMatch(/₹|INR/);
      expect(formatted[1]).toContain("8,500");

      // USD formatting contains $
      expect(formatted[2]).toContain("$240.00");
    });
  });
});
