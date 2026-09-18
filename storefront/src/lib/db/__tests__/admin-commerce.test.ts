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
    it("strictly filters for role='customer' and joins auth.users without N+1", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: TEST_USER_ID,
            email: "shoelover@example.com",
            first_name: "Jane",
            last_name: "Doe",
            phone: "+1234567890",
            created_at: new Date("2026-09-01T12:00:00Z"),
            order_count: 3,
            historical_order_total_in_cents: "75000",
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
      expect(params).toContain("%shoelover%");

      expect(result.totalCount).toBe(18);
      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].email).toBe("shoelover@example.com");
      expect(result.customers[0].orderCount).toBe(3);
      expect(result.customers[0].historicalOrderTotalInCents).toBe(75000);
      expect(result.customers[0].addressCount).toBe(2);
    });
  });

  describe("getAdminCustomerDetail", () => {
    it("returns null for non-UUID customer ID", async () => {
      const customer = await getAdminCustomerDetail("invalid-uuid");
      expect(customer).toBeNull();
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it("executes exactly 3 bounded queries: profile, addresses, and order history", async () => {
      // 1. Profile + Auth
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

      // 3. Orders history strictly by user_id
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
        ],
      });

      const customer = await getAdminCustomerDetail(TEST_USER_ID);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(customer).not.toBeNull();
      expect(customer?.email).toBe("shoelover@example.com");
      expect(customer?.role).toBe("customer");
      expect(customer?.addresses).toHaveLength(1);
      expect(customer?.addresses[0].isDefaultShipping).toBe(true);
      expect(customer?.orders).toHaveLength(1);
      expect(customer?.orders[0].orderNumber).toBe("MRZ-TEST123456");

      // Verify third query strictly used orders.user_id = $1
      const orderHistorySql = String(mockDb.query.mock.calls[2][0]);
      expect(orderHistorySql).toContain("o.user_id = $1");
      expect(orderHistorySql).not.toContain("o.email");
    });
  });
});
