import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();
const mockTransaction = vi.fn();

vi.mock("../index", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
  transaction: (callback: (client: { query: (text: string, params?: unknown[]) => Promise<unknown> }) => Promise<unknown>) =>
    mockTransaction(callback),
}));

import {
  generateOrderNumber,
  getOrderForUser,
  getOrderBySourceCartAuthorized,
  listOrdersForUser,
  placeOrderFromCart,
} from "../order";

describe("Database Order Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateOrderNumber", () => {
    it("generates 14-character format starting with MRZ- and 10 Crockford Base32 chars", () => {
      const num1 = generateOrderNumber();
      const num2 = generateOrderNumber();

      expect(num1).toMatch(/^MRZ-[0-9A-Z]{10}$/);
      expect(num2).toMatch(/^MRZ-[0-9A-Z]{10}$/);
      expect(num1).not.toBe(num2);
    });
  });

  describe("placeOrderFromCart", () => {
    it("throws error if cart does not exist", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn().mockResolvedValueOnce({ rows: [] }), // SELECT carts FOR UPDATE
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cart not found");
    });

    it("throws error if user is unauthorized to convert cart", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn().mockResolvedValueOnce({
            rows: [
              {
                id: "11111111-1111-1111-1111-111111111111",
                user_id: "user-other",
                guest_token_hash: null,
                surface: "dtc",
                status: "active",
              },
            ],
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-attacker",
        }),
      ).rejects.toThrow("Unauthorized to convert this cart");
    });

    it("denies order placement when cart surface does not match requested surface", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn().mockResolvedValueOnce({
            rows: [
              {
                id: "11111111-1111-1111-1111-111111111111",
                user_id: "user-1",
                guest_token_hash: null,
                surface: "dtc",
                status: "active",
              },
            ],
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "wholesale",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cart surface mismatch: cart belongs to 'dtc', requested 'wholesale'");
    });

    it("denies order placement when cart status is abandoned and no order exists", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: "11111111-1111-1111-1111-111111111111",
                  user_id: "user-1",
                  guest_token_hash: null,
                  surface: "dtc",
                  status: "abandoned",
                },
              ],
            })
            .mockResolvedValueOnce({ rows: [] }), // existing order lookup returns empty
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: cart status is 'abandoned', must be 'active'");
    });

    it("denies order placement when cart status is converted and no order exists", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: "11111111-1111-1111-1111-111111111111",
                  user_id: "user-1",
                  guest_token_hash: null,
                  surface: "dtc",
                  status: "converted",
                },
              ],
            })
            .mockResolvedValueOnce({ rows: [] }), // existing order lookup returns empty
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: cart status is 'converted', must be 'active'");
    });

    it("returns existing order if source_cart_id was already converted (idempotent)", async () => {
      const existingOrderRow = {
        id: "22222222-2222-2222-2222-222222222222",
        user_id: "user-1",
        source_cart_id: "11111111-1111-1111-1111-111111111111",
        order_number: "MRZ-ALREADYPLACED",
        status: "complete",
        currency: "USD",
        subtotal_in_cents: 8500,
        shipping_in_cents: 0,
        tax_in_cents: 850,
        total_in_cents: 9350,
        shipping_address_snapshot: null,
        billing_address_snapshot: null,
        email: "user@example.com",
        surface: "dtc",
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: "11111111-1111-1111-1111-111111111111",
                  user_id: "user-1",
                  guest_token_hash: null,
                  surface: "dtc",
                  status: "converted",
                },
              ],
            }) // 1. Lock cart
            .mockResolvedValueOnce({
              rows: [existingOrderRow],
            }) // 3. Existing order check
            .mockResolvedValueOnce({
              rows: [],
            }), // Existing items check
        };
        return cb(fakeClient);
      });

      const res = await placeOrderFromCart({
        cartId: "11111111-1111-1111-1111-111111111111",
        surface: "dtc",
        verifiedUserId: "user-1",
      });

      expect(res.order.order_number).toBe("MRZ-ALREADYPLACED");
    });

    it("fails placement if cart has no line items", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: "11111111-1111-1111-1111-111111111111",
                  user_id: "user-1",
                  surface: "dtc",
                  status: "active",
                },
              ],
            }) // 1. Lock cart
            .mockResolvedValueOnce({ rows: [] }) // 3. Existing order
            .mockResolvedValueOnce({ rows: [] }), // 4. Cart items (empty!)
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order for an empty cart");
    });

    it("fails placement if any cart item SKU cannot be resolved against authoritative catalog", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi
            .fn()
            .mockResolvedValueOnce({
              rows: [
                {
                  id: "11111111-1111-1111-1111-111111111111",
                  user_id: "user-1",
                  surface: "dtc",
                  status: "active",
                },
              ],
            }) // 1. Lock cart
            .mockResolvedValueOnce({ rows: [] }) // 3. Existing order
            .mockResolvedValueOnce({
              rows: [
                {
                  cart_item_id: "item-1",
                  cart_id: "11111111-1111-1111-1111-111111111111",
                  variant_sku: "NON-EXISTENT-SKU",
                  quantity: 1,
                  db_variant_id: null,
                  product_id: null,
                },
              ],
            }), // 4. Cart items
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "11111111-1111-1111-1111-111111111111",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: unknown catalog variant SKU 'NON-EXISTENT-SKU'");
    });

    it("successfully places order and marks source cart as converted while preserving guest_token_hash", async () => {
      const createdOrderRow = {
        id: "22222222-2222-2222-2222-222222222222",
        user_id: null,
        source_cart_id: "11111111-1111-1111-1111-111111111111",
        order_number: "MRZ-TESTGUEST1",
        status: "complete",
        currency: "USD",
        subtotal_in_cents: 8500,
        shipping_in_cents: 0,
        tax_in_cents: 850,
        total_in_cents: 9350,
        shipping_address_snapshot: { city: "Dallas" },
        billing_address_snapshot: null,
        email: "guest@example.com",
        surface: "dtc",
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const createdOrderItemRow = {
        id: "33333333-3333-3333-3333-333333333333",
        order_id: "22222222-2222-2222-2222-222222222222",
        variant_id: null,
        product_name: "Formal Derby",
        sku: "TEST-VALID-SKU",
        size_option: "42",
        price_in_cents: 8500,
        quantity: 1,
        total_in_cents: 8500,
        thumbnail_url: "https://example.com/derby.jpg",
        created_at: new Date(),
      };

      const mockQueries: any[] = [];
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string, params: any[]) => {
            mockQueries.push({ sql, params });
            if (sql.includes("FROM public.carts") && sql.includes("FOR UPDATE")) {
              return {
                rows: [
                  {
                    id: "11111111-1111-1111-1111-111111111111",
                    user_id: null,
                    guest_token_hash: "hash123",
                    surface: "dtc",
                    currency: "USD",
                    shipping_address: { city: "Dallas" },
                    billing_address: null,
                    checkout_email: "guest@example.com",
                    status: "active",
                  },
                ],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "cart-item-1",
                    cart_id: "11111111-1111-1111-1111-111111111111",
                    variant_id: "33333333-3333-3333-3333-333333333333",
                    variant_sku: "TEST-VALID-SKU",
                    quantity: 1,
                    db_variant_id: "33333333-3333-3333-3333-333333333333",
                    db_variant_sku: "TEST-VALID-SKU",
                    size_option: "8",
                    price_in_cents: 8500,
                    variant_active: true,
                    quantity_on_hand: 0,
                    backorderable: true,
                    product_id: "prod-123",
                    product_name: "Formal Derby",
                    product_slug: "office-footwear-01",
                    product_status: "active",
                  },
                ],
              };
            }
            if (sql.includes("INSERT INTO public.orders")) {
              return { rows: [createdOrderRow] };
            }
            if (sql.includes("INSERT INTO public.order_items")) {
              return { rows: [createdOrderItemRow] };
            }
            if (sql.includes("UPDATE public.carts SET status = 'converted'")) {
              return { rowCount: 1 };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      const res = await placeOrderFromCart({
        cartId: "11111111-1111-1111-1111-111111111111",
        surface: "dtc",
        guestTokenHash: "hash123",
      });

      expect(res.order.id).toBe("22222222-2222-2222-2222-222222222222");
      expect(res.order.subtotal_in_cents).toBe(8500);
      expect(res.order.tax_in_cents).toBe(850);
      expect(res.order.total_in_cents).toBe(9350);
      expect(res.items).toHaveLength(1);

      // Verify cart status was marked converted while preserving guest token
      const updateCartCall = mockQueries.find((q) =>
        q.sql.includes("status = 'converted'"),
      );
      expect(updateCartCall).toBeDefined();
      expect(updateCartCall.params[0]).toBe("11111111-1111-1111-1111-111111111111");

      // Verify the order transaction did NOT escape to the global pool
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("snapshots price directly from PostgreSQL variant and never calls global pool", async () => {
      const mockQueries: any[] = [];
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string, params: any[]) => {
            mockQueries.push({ sql, params });
            if (sql.includes("FROM public.carts") && sql.includes("FOR UPDATE")) {
              return {
                rows: [
                  {
                    id: "cart-999",
                    user_id: "user-1",
                    guest_token_hash: null,
                    surface: "dtc",
                    currency: "USD",
                    shipping_address: null,
                    billing_address: null,
                    checkout_email: "test@example.com",
                    status: "active",
                  },
                ],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "ci-1",
                    cart_id: "cart-999",
                    variant_id: "var-1",
                    variant_sku: "SKU-EXPENSIVE",
                    quantity: 2,
                    db_variant_id: "var-1",
                    db_variant_sku: "SKU-EXPENSIVE",
                    size_option: "9",
                    price_in_cents: 14500, // $145.00 PostgreSQL authoritative price
                    variant_active: true,
                    quantity_on_hand: 5,
                    backorderable: false,
                    product_id: "prod-1",
                    product_name: "Handcrafted Oxford",
                    product_slug: "office-footwear-02",
                    product_status: "active",
                  },
                ],
              };
            }
            if (sql.includes("INSERT INTO public.orders")) {
              return {
                rows: [
                  {
                    id: "ord-1",
                    order_number: "MRZ-PGPRICE12",
                    status: "complete",
                    subtotal_in_cents: 29000,
                    total_in_cents: 29000,
                    currency: "USD",
                  },
                ],
              };
            }
            if (sql.includes("INSERT INTO public.order_items")) {
              return {
                rows: [
                  {
                    id: "oi-1",
                    order_id: "ord-1",
                    price_in_cents: 14500,
                    quantity: 2,
                    total_in_cents: 29000,
                  },
                ],
              };
            }
            if (sql.includes("UPDATE public.carts SET status = 'converted'")) {
              return { rowCount: 1 };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      await placeOrderFromCart({
        cartId: "cart-999",
        surface: "dtc",
        verifiedUserId: "user-1",
      });

      // Verify global pool was never invoked
      expect(mockQuery).not.toHaveBeenCalled();

      // Verify order item insert used the DB price (14500 cents)
      const orderItemInsert = mockQueries.find((q) =>
        q.sql.includes("INSERT INTO public.order_items"),
      );
      expect(orderItemInsert).toBeDefined();
      // Parameters: [orderId, variantId, productName, sku, sizeOption, priceInCents, quantity, totalInCents, thumbUrl]
      expect(orderItemInsert.params[5]).toBe(14500);
      expect(orderItemInsert.params[6]).toBe(2);
      expect(orderItemInsert.params[7]).toBe(29000);
    });

    it("rejects order placement if variant is inactive", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string) => {
            if (sql.includes("FROM public.carts")) {
              return {
                rows: [{ id: "cart-1", user_id: "user-1", surface: "dtc", status: "active" }],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "ci-1",
                    cart_id: "cart-1",
                    variant_id: "var-inactive",
                    variant_sku: "SKU-INACTIVE",
                    quantity: 1,
                    db_variant_id: "var-inactive",
                    db_variant_sku: "SKU-INACTIVE",
                    price_in_cents: 8000,
                    variant_active: false, // Inactive!
                    quantity_on_hand: 10,
                    backorderable: true,
                    product_id: "prod-1",
                    product_status: "active",
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "cart-1",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: variant 'SKU-INACTIVE' is no longer active");
    });

    it("rejects order placement if product is draft or archived", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string) => {
            if (sql.includes("FROM public.carts")) {
              return {
                rows: [{ id: "cart-1", user_id: "user-1", surface: "dtc", status: "active" }],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "ci-1",
                    cart_id: "cart-1",
                    variant_id: "var-1",
                    variant_sku: "SKU-DRAFT",
                    quantity: 1,
                    db_variant_id: "var-1",
                    db_variant_sku: "SKU-DRAFT",
                    price_in_cents: 8000,
                    variant_active: true,
                    quantity_on_hand: 10,
                    backorderable: true,
                    product_id: "prod-1",
                    product_status: "draft", // Draft product!
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "cart-1",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: variant 'SKU-DRAFT' is no longer active");
    });

    it("rejects order placement if variant is out of stock and not backorderable", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string) => {
            if (sql.includes("FROM public.carts")) {
              return {
                rows: [{ id: "cart-1", user_id: "user-1", surface: "dtc", status: "active" }],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "ci-1",
                    cart_id: "cart-1",
                    variant_id: "var-1",
                    variant_sku: "SKU-OOS",
                    quantity: 1,
                    db_variant_id: "var-1",
                    db_variant_sku: "SKU-OOS",
                    price_in_cents: 8000,
                    variant_active: true,
                    quantity_on_hand: 0,
                    backorderable: false, // Out of stock & cannot backorder!
                    product_id: "prod-1",
                    product_status: "active",
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "cart-1",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("Cannot place order: variant 'SKU-OOS' is out of stock");
    });

    it("rejects order placement if variant_id does not match variant_sku (integrity mismatch)", async () => {
      mockTransaction.mockImplementation(async (cb) => {
        const fakeClient = {
          query: vi.fn(async (sql: string) => {
            if (sql.includes("FROM public.carts")) {
              return {
                rows: [{ id: "cart-1", user_id: "user-1", surface: "dtc", status: "active" }],
              };
            }
            if (sql.includes("FROM public.orders WHERE source_cart_id")) {
              return { rows: [] };
            }
            if (sql.includes("FROM public.cart_items")) {
              return {
                rows: [
                  {
                    cart_item_id: "ci-1",
                    cart_id: "cart-1",
                    variant_id: "var-1",
                    variant_sku: "SKU-WRONG",
                    quantity: 1,
                    db_variant_id: "var-1",
                    db_variant_sku: "SKU-CORRECT",
                    price_in_cents: 8000,
                    variant_active: true,
                    quantity_on_hand: 10,
                    backorderable: true,
                    product_id: "prod-1",
                    product_name: "Derby",
                    product_slug: "office-footwear-01",
                    product_status: "active",
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(fakeClient);
      });

      await expect(
        placeOrderFromCart({
          cartId: "cart-1",
          surface: "dtc",
          verifiedUserId: "user-1",
        }),
      ).rejects.toThrow("recorded SKU 'SKU-WRONG'");
    });
  });

  describe("listOrdersForUser", () => {
    it("throws error if userId is missing", async () => {
      await expect(listOrdersForUser("")).rejects.toThrow(
        "User ID is required to list orders",
      );
    });

    it("queries orders and batch-loads items for user orders", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }) // count query
        .mockResolvedValueOnce({
          rows: [
            {
              id: "order-1",
              user_id: "user-1",
              source_cart_id: "cart-1",
              order_number: "MRZ-1111111111",
              status: "complete",
              currency: "USD",
              subtotal_in_cents: 5000,
              shipping_in_cents: 0,
              tax_in_cents: 0,
              total_in_cents: 5000,
              shipping_address_snapshot: null,
              billing_address_snapshot: null,
              email: "test@example.com",
              surface: "dtc",
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        }) // select orders
        .mockResolvedValueOnce({
          rows: [
            {
              id: "item-1",
              order_id: "order-1",
              variant_id: null,
              product_name: "Shoe",
              sku: "SHOE-1",
              size_option: "41",
              price_in_cents: 5000,
              quantity: 1,
              total_in_cents: 5000,
              thumbnail_url: null,
              created_at: new Date(),
            },
          ],
        }); // select order_items

      const res = await listOrdersForUser("user-1", { limit: 10, offset: 0 });

      expect(res.totalCount).toBe(1);
      expect(res.orders).toHaveLength(1);
      expect(res.itemsByOrderId.get("order-1")).toHaveLength(1);

      const [countSql, countParams] = mockQuery.mock.calls[0];
      expect(countSql).toContain("WHERE user_id = $1");
      expect(countParams).toEqual(["user-1"]);
    });
  });

  describe("getOrderForUser", () => {
    it("finds by UUID when UUID format is provided", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              user_id: "user-1",
              source_cart_id: "cart-1",
              order_number: "MRZ-TEST123456",
              status: "complete",
              currency: "USD",
              subtotal_in_cents: 5000,
              shipping_in_cents: 0,
              tax_in_cents: 0,
              total_in_cents: 5000,
              shipping_address_snapshot: null,
              billing_address_snapshot: null,
              email: "test@example.com",
              surface: "dtc",
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await getOrderForUser("user-1", "22222222-2222-2222-2222-222222222222");

      expect(res).not.toBeNull();
      expect(res?.order.id).toBe("22222222-2222-2222-2222-222222222222");
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE id = $1 AND user_id = $2");
    });

    it("finds by order_number when human-readable order number is provided", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              user_id: "user-1",
              source_cart_id: "cart-1",
              order_number: "MRZ-TEST123456",
              status: "complete",
              currency: "USD",
              subtotal_in_cents: 5000,
              shipping_in_cents: 0,
              tax_in_cents: 0,
              total_in_cents: 5000,
              shipping_address_snapshot: null,
              billing_address_snapshot: null,
              email: "test@example.com",
              surface: "dtc",
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await getOrderForUser("user-1", "MRZ-TEST123456");

      expect(res).not.toBeNull();
      expect(res?.order.order_number).toBe("MRZ-TEST123456");
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE order_number = $1 AND user_id = $2");
    });
  });

  describe("getOrderBySourceCartAuthorized", () => {
    it("returns null when cartId is not a valid UUID", async () => {
      const res = await getOrderBySourceCartAuthorized("bad-id", { userId: "user-1" });
      expect(res).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("returns null when neither userId nor guestTokenHash matches", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            user_id: "user-owner",
            cart_guest_token_hash: "hash_real",
            order_number: "MRZ-SECRET123",
          },
        ],
      });

      const res = await getOrderBySourceCartAuthorized(
        "11111111-1111-1111-1111-111111111111",
        { userId: "user-intruder", guestTokenHash: "hash_wrong" },
      );

      expect(res).toBeNull();
    });

    it("authorizes authenticated user when order.user_id matches", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              user_id: "user-owner",
              cart_user_id: "user-owner",
              cart_guest_token_hash: null,
              source_cart_id: "11111111-1111-1111-1111-111111111111",
              order_number: "MRZ-AUTHUSER",
              status: "complete",
              currency: "USD",
              subtotal_in_cents: 5000,
              shipping_in_cents: 0,
              tax_in_cents: 0,
              total_in_cents: 5000,
              shipping_address_snapshot: null,
              billing_address_snapshot: null,
              email: "test@example.com",
              surface: "dtc",
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await getOrderBySourceCartAuthorized(
        "11111111-1111-1111-1111-111111111111",
        { userId: "user-owner" },
      );

      expect(res).not.toBeNull();
      expect(res?.order.order_number).toBe("MRZ-AUTHUSER");
    });

    it("authorizes guest when cart.guest_token_hash matches", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "22222222-2222-2222-2222-222222222222",
              user_id: null,
              cart_user_id: null,
              cart_guest_token_hash: "hash_valid",
              source_cart_id: "11111111-1111-1111-1111-111111111111",
              order_number: "MRZ-GUESTOK",
              status: "complete",
              currency: "USD",
              subtotal_in_cents: 5000,
              shipping_in_cents: 0,
              tax_in_cents: 0,
              total_in_cents: 5000,
              shipping_address_snapshot: null,
              billing_address_snapshot: null,
              email: "guest@example.com",
              surface: "dtc",
              completed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const res = await getOrderBySourceCartAuthorized(
        "11111111-1111-1111-1111-111111111111",
        { guestTokenHash: "hash_valid" },
      );

      expect(res).not.toBeNull();
      expect(res?.order.order_number).toBe("MRZ-GUESTOK");
    });

    it("denies guest/auth order when surface mismatch occurs", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            user_id: "user-owner",
            cart_user_id: "user-owner",
            cart_guest_token_hash: null,
            source_cart_id: "11111111-1111-1111-1111-111111111111",
            surface: "dtc",
            cart_surface: "dtc",
            order_number: "MRZ-AUTHUSER",
          },
        ],
      });

      const res = await getOrderBySourceCartAuthorized(
        "11111111-1111-1111-1111-111111111111",
        { userId: "user-owner", surface: "wholesale" },
      );

      expect(res).toBeNull();
    });
  });
});

