import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory state for db/cart mock
const mockCarts = new Map<string, any>();
const mockItems = new Map<string, any[]>();

const mockDbCart = vi.hoisted(() => ({
  createGuestCart: vi.fn(async (guestTokenHash: string, surface: string, currency: string) => {
    const cart = {
      id: "test-cart-uuid-1234",
      user_id: null,
      token_hash: guestTokenHash,
      surface,
      currency,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCarts.set(cart.id, cart);
    mockItems.set(cart.id, []);
    return cart;
  }),
  findActiveGuestCart: vi.fn(async (guestTokenHash: string, _surface: string) => {
    for (const cart of mockCarts.values()) {
      if (cart.token_hash === guestTokenHash && cart.status === "active") {
        return cart;
      }
    }
    return null;
  }),
  findActiveUserCart: vi.fn().mockResolvedValue(null),
  findCartById: vi.fn(async (cartId: string) => mockCarts.get(cartId) || null),
  loadCartItems: vi.fn(async (cartId: string) => mockItems.get(cartId) || []),
  addOrIncrementCartItem: vi.fn(async (cartId: string, sku: string, quantity: number) => {
    const items = mockItems.get(cartId) || [];
    const existing = items.find((i) => i.variant_sku === sku);
    if (existing) {
      existing.quantity += quantity;
      return existing;
    }
    const newItem = {
      id: `item-${Date.now()}`,
      cart_id: cartId,
      variant_sku: sku,
      quantity,
      unit_price: "99.00",
      created_at: new Date().toISOString(),
    };
    items.push(newItem);
    mockItems.set(cartId, items);
    return newItem;
  }),
  updateCartItemQuantity: vi.fn(async (cartId: string, lineItemId: string, quantity: number) => {
    const items = mockItems.get(cartId) || [];
    const item = items.find((i) => i.id === lineItemId);
    if (!item) return false;
    item.quantity = quantity;
    return true;
  }),
  removeCartItem: vi.fn(async (cartId: string, lineItemId: string) => {
    const items = mockItems.get(cartId) || [];
    const filtered = items.filter((i) => i.id !== lineItemId);
    mockItems.set(cartId, filtered);
    return true;
  }),
  markCartAbandoned: vi.fn(async (cartId: string) => {
    const cart = mockCarts.get(cartId);
    if (cart) cart.status = "abandoned";
    return true;
  }),
  claimOrMergeGuestCart: vi.fn(),
  createUserCart: vi.fn(),
}));

vi.mock("@/lib/db/cart", () => mockDbCart);

// Track cookie operations
const cookieJar = new Map<string, { value: string; options?: any }>();
const mockCookieStore = {
  get: vi.fn((name: string) => {
    const val = cookieJar.get(name);
    return val ? { name, value: val.value } : undefined;
  }),
  getAll: vi.fn(() => Array.from(cookieJar.entries()).map(([name, { value }]) => ({ name, value }))),
  has: vi.fn((name: string) => cookieJar.has(name)),
  set: vi.fn((name: string, value: string, options?: any) => {
    if (options?.maxAge === -1 || value === "") {
      cookieJar.delete(name);
    } else {
      cookieJar.set(name, { value, options });
    }
  }),
  delete: vi.fn((name: string) => cookieJar.delete(name)),
};

vi.mock("next/headers", () => ({
  cookies: () => mockCookieStore,
  headers: () => new Map(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims: null }, error: null }),
    },
  }),
}));

// Real route handlers using real cart.ts (unmocked)
import { DELETE, GET, PATCH, POST } from "../route";

describe("BFF Route Handler & Cart Integration Regression Tests", () => {
  beforeEach(() => {
    mockCarts.clear();
    mockItems.clear();
    cookieJar.clear();
    vi.clearAllMocks();
  });

  it("POST /api/v3/store/carts creates a cart, sets cookies, and throws NO updateTag error", async () => {
    const req = new NextRequest("http://localhost:3000/api/v3/store/carts", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    const params = Promise.resolve({ spree: ["carts"] });

    const res = await POST(req, { params });

    expect(res.status).toBe(200);
    const cart = await res.json();
    expect(cart.id).toBe("test-cart-uuid-1234");
    expect(cart.items).toEqual([]);

    // Check that cookies were set
    expect(mockCookieStore.set).toHaveBeenCalled();
    expect(cookieJar.has("_spree_cart_token_id")).toBe(true);
    expect(cookieJar.has("_spree_cart_token")).toBe(true);
    expect(cookieJar.get("_spree_cart_token_id")?.value).toBe("test-cart-uuid-1234");
  });

  it("Full cart lifecycle: GET cart, POST item, PATCH quantity, DELETE item via Route Handlers", async () => {
    // 1. Create cart
    const createReq = new NextRequest("http://localhost:3000/api/v3/store/carts", {
      method: "POST",
    });
    const createRes = await POST(createReq, { params: Promise.resolve({ spree: ["carts"] }) });
    expect(createRes.status).toBe(200);
    const createdCart = await createRes.json();
    const cartId = createdCart.id;

    // 2. GET /api/v3/store/cart
    const getReq = new NextRequest("http://localhost:3000/api/v3/store/cart", {
      method: "GET",
    });
    const getRes = await GET(getReq, { params: Promise.resolve({ spree: ["cart"] }) });
    expect(getRes.status).toBe(200);
    const fetchedCart = await getRes.json();
    expect(fetchedCart.id).toBe(cartId);

    // 3. POST /api/v3/store/carts/:id/items
    const addReq = new NextRequest(`http://localhost:3000/api/v3/store/carts/${cartId}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variant_id: "var_office_footwear_01_8", quantity: 1 }),
    });
    const addRes = await POST(addReq, { params: Promise.resolve({ spree: ["carts", cartId, "items"] }) });
    expect(addRes.status).toBe(200);
    const cartWithItem = await addRes.json();
    expect(cartWithItem.items.length).toBe(1);
    expect(cartWithItem.items[0].sku).toBe("MIRZA-OFF-001-8");
    expect(cartWithItem.items[0].quantity).toBe(1);
    const lineItemId = cartWithItem.items[0].id;

    // 4. PATCH /api/v3/store/carts/:id/items/:itemId
    const patchReq = new NextRequest(
      `http://localhost:3000/api/v3/store/carts/${cartId}/items/${lineItemId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: 3 }),
      },
    );
    const patchRes = await PATCH(patchReq, {
      params: Promise.resolve({ spree: ["carts", cartId, "items", lineItemId] }),
    });
    expect(patchRes.status).toBe(200);
    const cartUpdated = await patchRes.json();
    expect(cartUpdated.items[0].quantity).toBe(3);

    // 5. DELETE /api/v3/store/carts/:id/items/:itemId
    const delReq = new NextRequest(
      `http://localhost:3000/api/v3/store/carts/${cartId}/items/${lineItemId}`,
      { method: "DELETE" },
    );
    const delRes = await DELETE(delReq, {
      params: Promise.resolve({ spree: ["carts", cartId, "items", lineItemId] }),
    });
    expect(delRes.status).toBe(200);
    const cartAfterDelete = await delRes.json();
    expect(cartAfterDelete.items.length).toBe(0);
  });
});
