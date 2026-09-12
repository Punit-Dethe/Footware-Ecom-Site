import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for DB and Spree
const mockDb = vi.hoisted(() => ({
  findActiveGuestCart: vi.fn(),
  findActiveUserCart: vi.fn(),
  findCartById: vi.fn(),
  createGuestCart: vi.fn(),
  createUserCart: vi.fn(),
  loadCartItems: vi.fn(),
  addOrIncrementCartItem: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  markCartAbandoned: vi.fn(),
  claimOrMergeGuestCart: vi.fn(),
}));

const mockSpree = vi.hoisted(() => ({
  getCartId: vi.fn(),
  getCartToken: vi.fn(),
  setCartCookies: vi.fn(),
  clearCartCookies: vi.fn(),
  clearCartToken: vi.fn(),
  cacheTagSuffix: (surface: string) => (surface === "wholesale" ? ":wholesale" : ""),
  DEFAULT_SURFACE: "dtc" as const,
  isPoisonedDtcCartId: vi.fn().mockResolvedValue(false),
}));

const mockSupabase = vi.hoisted(() => ({
  auth: {
    getClaims: vi.fn().mockResolvedValue({ data: { claims: null }, error: null }),
  },
}));

vi.mock("@/lib/db/cart", () => mockDb);
vi.mock("@/lib/spree", () => mockSpree);
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));
vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

const { mockCookies } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    mockCookies: {
      get: vi.fn((key: string) => {
        const val = store.get(key);
        return val ? { name: key, value: val } : undefined;
      }),
      getAll: vi.fn(() =>
        Array.from(store.entries()).map(([name, value]) => ({ name, value })),
      ),
      set: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn((key: string) => {
        store.delete(key);
      }),
      _store: store,
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookies),
  headers: vi.fn().mockReturnValue(new Map()),
}));

import {
  addToCart,
  associateCartWithUser,
  clearCart,
  getCart,
  getOrCreateCart,
  removeCartItem,
  syncCartOnAuthChange,
  updateCartItem,
} from "@/lib/data/cart";
import { PRODUCTS } from "@/lib/catalog/catalog-repository";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

describe("B3 Persistent Cart — Server Actions & Data Layer", () => {
  const validProduct = PRODUCTS[0];
  const validVariant = validProduct.variants[0];
  const rawBearerToken = "test_raw_guest_token_1234567890abcdef";
  const hashedBearerToken = hashToken(rawBearerToken);

  const mockDbCart = {
    id: "cart-uuid-1",
    user_id: null,
    guest_token_hash: hashedBearerToken,
    surface: "dtc" as const,
    currency: "USD",
    status: "active" as const,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockDbLineItem = {
    id: "item-uuid-1",
    cart_id: "cart-uuid-1",
    variant_sku: validVariant.sku,
    variant_id: validVariant.id,
    quantity: 2,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies._store.clear();
    mockSpree.getCartId.mockResolvedValue(undefined);
    mockSpree.getCartToken.mockResolvedValue(undefined);
    mockSpree.isPoisonedDtcCartId.mockResolvedValue(false);
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });
  });

  describe("getCart & Security (IDOR / Token Hashing)", () => {
    it("returns null when no cookies and no auth exist (0 DB queries for guest)", async () => {
      mockSpree.getCartId.mockResolvedValue(undefined);
      mockSpree.getCartToken.mockResolvedValue(undefined);

      const cart = await getCart();
      expect(cart).toBeNull();
      expect(mockDb.findActiveGuestCart).not.toHaveBeenCalled();
      expect(mockDb.findActiveUserCart).not.toHaveBeenCalled();
    });

    it("short-circuits anonymous callers without auth claims lookup when no sb-* cookie exists", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.loadCartItems.mockResolvedValue([]);

      await getCart();

      // No sb-*-auth-token cookie in store -> supabase.auth.getClaims must NOT be called
      expect(mockSupabase.auth.getClaims).not.toHaveBeenCalled();
      expect(mockDb.findActiveGuestCart).toHaveBeenCalledWith(hashedBearerToken, "dtc");
    });

    it("fetches guest cart when raw bearer token matches hashed token in DB", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.loadCartItems.mockResolvedValue([mockDbLineItem]);

      const cart = (await getCart()) as any;
      expect(cart).not.toBeNull();
      expect(cart?.id).toBe("cart-uuid-1");
      expect(cart?.items).toHaveLength(1);
      expect(cart?.items[0].sku).toBe(validVariant.sku);
      expect(cart?.items[0].quantity).toBe(2);
      expect(cart?.item_count).toBe(2);
      expect(cart?.total_amount.amount_in_cents).toBe(
        validVariant.price.amount_in_cents * 2,
      );
    });

    it("IDOR protection: rejects guest cart if raw token does NOT match DB hash", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue("invalid-attacker-raw-token");
      mockDb.findActiveGuestCart.mockResolvedValue(null);

      const cart = await getCart();
      expect(cart).toBeNull();
      expect(mockSpree.clearCartCookies).toHaveBeenCalledWith("dtc");
    });

    it("IDOR protection: rejects cart if guest token cookie is missing entirely", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(undefined);

      const cart = await getCart();
      expect(cart).toBeNull();
      expect(mockDb.findActiveGuestCart).not.toHaveBeenCalled();
    });

    it("cross-surface isolation: rejects cart if surface mismatch", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(null);

      const cart = await getCart(undefined, "dtc");
      expect(cart).toBeNull();
      expect(mockSpree.clearCartCookies).toHaveBeenCalledWith("dtc");
    });

    it("fetches active user cart when authenticated", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });

      const userCart = {
        ...mockDbCart,
        user_id: "user-123",
        guest_token_hash: null,
      };
      mockDb.findActiveUserCart.mockResolvedValue(userCart);
      mockDb.loadCartItems.mockResolvedValue([]);

      const cart = await getCart();
      expect(cart).not.toBeNull();
      expect(cart?.id).toBe("cart-uuid-1");
      expect(mockDb.findActiveUserCart).toHaveBeenCalledWith("user-123", "dtc");
    });
  });

  describe("getOrCreateCart", () => {
    it("returns existing active guest cart if already present", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.loadCartItems.mockResolvedValue([]);

      const cart = await getOrCreateCart();
      expect(cart.id).toBe("cart-uuid-1");
      expect(mockDb.createGuestCart).not.toHaveBeenCalled();
    });

    it("creates a new guest cart with hashed bearer token and sets cookies", async () => {
      mockSpree.getCartId.mockResolvedValue(undefined);
      mockSpree.getCartToken.mockResolvedValue(undefined);

      const createdCart = {
        id: "new-guest-cart-uuid",
        user_id: null,
        guest_token_hash: "some_hash",
        surface: "dtc" as const,
        currency: "USD",
        status: "active" as const,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.createGuestCart.mockResolvedValue(createdCart);

      const cart = await getOrCreateCart();
      expect(cart.id).toBe("new-guest-cart-uuid");
      expect(mockDb.createGuestCart).toHaveBeenCalledWith(
        expect.any(String), // guest_token_hash (64-char SHA-256)
        "dtc",
        "USD",
      );
      // Verify token hash is 64 hex characters (SHA-256)
      const passedHash = mockDb.createGuestCart.mock.calls[0][0];
      expect(passedHash).toMatch(/^[a-f0-9]{64}$/);

      expect(mockSpree.setCartCookies).toHaveBeenCalledWith(
        "new-guest-cart-uuid",
        expect.any(String),
        "dtc",
      );
    });

    it("creates a new user cart when authenticated and sets user cart cookie", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-456" } },
        error: null,
      });
      mockDb.findActiveUserCart.mockResolvedValue(null);

      const newUserCart = {
        id: "new-user-cart-uuid",
        user_id: "user-456",
        guest_token_hash: null,
        surface: "dtc" as const,
        currency: "USD",
        status: "active" as const,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.createUserCart.mockResolvedValue(newUserCart);

      const cart = await getOrCreateCart();
      expect(cart.id).toBe("new-user-cart-uuid");
      expect(mockDb.createUserCart).toHaveBeenCalledWith("user-456", "dtc", "USD");
      expect(mockSpree.setCartCookies).toHaveBeenCalledWith(
        "new-user-cart-uuid",
        undefined,
        "dtc",
      );
    });
  });

  describe("addToCart & Variant Validation (No PRODUCTS[0] Fallback)", () => {
    it("rejects invalid variant SKU / ID with error and NEVER falls back to PRODUCTS[0]", async () => {
      const result = (await addToCart("totally-bogus-sku-9999", 1)) as any;
      expect(result.success).toBe(false);
      expect(result.error).toBe("Variant not found in catalog");
      expect(mockDb.addOrIncrementCartItem).not.toHaveBeenCalled();
    });

    it("successfully adds valid variant to cart and adapts response", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.loadCartItems.mockResolvedValue([mockDbLineItem]);
      mockDb.addOrIncrementCartItem.mockResolvedValue({
        ...mockDbLineItem,
        quantity: 2,
      });

      const result = (await addToCart(validVariant.sku, 2)) as any;
      expect(result.success).toBe(true);
      expect(result.cart).toBeDefined();
      expect(mockDb.addOrIncrementCartItem).toHaveBeenCalledWith(
        "cart-uuid-1",
        validVariant.sku,
        2,
      );
      expect(result.cart?.items[0].sku).toBe(validVariant.sku);
      expect(result.cart?.items[0].quantity).toBe(2);
    });

    it("duplicate add increments quantity atomically in DB", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.loadCartItems.mockResolvedValue([
        { ...mockDbLineItem, quantity: 3 },
      ]);
      mockDb.addOrIncrementCartItem.mockResolvedValue({
        ...mockDbLineItem,
        quantity: 3,
      });

      const result = (await addToCart(validVariant.id, 1)) as any;
      expect(result.success).toBe(true);
      expect(mockDb.addOrIncrementCartItem).toHaveBeenCalledWith(
        "cart-uuid-1",
        validVariant.sku,
        1,
      );
      expect(result.cart?.item_count).toBe(3);
    });
  });

  describe("updateCartItem & removeCartItem", () => {
    it("updates line item quantity", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.updateCartItemQuantity.mockResolvedValue({
        ...mockDbLineItem,
        quantity: 5,
      });
      mockDb.loadCartItems.mockResolvedValue([
        { ...mockDbLineItem, quantity: 5 },
      ]);

      const result = (await updateCartItem("item-uuid-1", 5)) as any;
      expect(result.success).toBe(true);
      expect(mockDb.updateCartItemQuantity).toHaveBeenCalledWith(
        "cart-uuid-1",
        "item-uuid-1",
        5,
      );
      expect(result.cart?.item_count).toBe(5);
    });

    it("removes line item from cart", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.removeCartItem.mockResolvedValue(true);
      mockDb.loadCartItems.mockResolvedValue([]);

      const result = (await removeCartItem("item-uuid-1")) as any;
      expect(result.success).toBe(true);
      expect(mockDb.removeCartItem).toHaveBeenCalledWith(
        "cart-uuid-1",
        "item-uuid-1",
      );
      expect(result.cart?.items).toHaveLength(0);
      expect(result.cart?.item_count).toBe(0);
    });
  });

  describe("clearCart", () => {
    it("marks cart abandoned in DB and clears cookies", async () => {
      mockSpree.getCartId.mockResolvedValue("cart-uuid-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.findActiveGuestCart.mockResolvedValue(mockDbCart);
      mockDb.markCartAbandoned.mockResolvedValue(true);

      const result = await clearCart();
      expect(result.success).toBe(true);
      expect(mockDb.markCartAbandoned).toHaveBeenCalledWith("cart-uuid-1");
      expect(mockSpree.clearCartCookies).toHaveBeenCalledWith("dtc");
    });
  });

  describe("Auth Transitions & Cart Claim / Merge (Cases A, B, C)", () => {
    it("Case A: user has no active cart, claims guest cart", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });

      mockSpree.getCartId.mockResolvedValue("guest-cart-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);

      const claimedCart = {
        ...mockDbCart,
        id: "guest-cart-1",
        user_id: "user-123",
        guest_token_hash: null,
      };
      mockDb.claimOrMergeGuestCart.mockResolvedValue(claimedCart);
      mockDb.loadCartItems.mockResolvedValue([mockDbLineItem]);

      const cart = await syncCartOnAuthChange("dtc");
      expect(cart).not.toBeNull();
      expect(mockDb.claimOrMergeGuestCart).toHaveBeenCalledWith(
        "user-123",
        hashedBearerToken,
        "dtc",
      );
      expect(mockSpree.clearCartToken).toHaveBeenCalledWith("dtc");
      expect(mockSpree.setCartCookies).toHaveBeenCalledWith(
        "guest-cart-1",
        undefined,
        "dtc",
      );
    });

    it("Case B: user has active cart and guest has cart, merges items", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });

      mockSpree.getCartId.mockResolvedValue("guest-cart-1");
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);

      const userCart = {
        ...mockDbCart,
        id: "user-cart-existing",
        user_id: "user-123",
        guest_token_hash: null,
      };
      mockDb.claimOrMergeGuestCart.mockResolvedValue(userCart);
      mockDb.loadCartItems.mockResolvedValue([mockDbLineItem]);

      const cart = await syncCartOnAuthChange("dtc");
      expect(cart).not.toBeNull();
      expect(cart?.id).toBe("user-cart-existing");
      expect(mockDb.claimOrMergeGuestCart).toHaveBeenCalledWith(
        "user-123",
        hashedBearerToken,
        "dtc",
      );
      expect(mockSpree.clearCartToken).toHaveBeenCalledWith("dtc");
      expect(mockSpree.setCartCookies).toHaveBeenCalledWith(
        "user-cart-existing",
        undefined,
        "dtc",
      );
    });

    it("Case C: user has active cart, no guest cart exists, returns user cart", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });

      mockSpree.getCartId.mockResolvedValue(undefined);
      mockSpree.getCartToken.mockResolvedValue(undefined);

      const userCart = {
        ...mockDbCart,
        id: "user-cart-existing",
        user_id: "user-123",
        guest_token_hash: null,
      };
      mockDb.findActiveUserCart.mockResolvedValue(userCart);
      mockDb.loadCartItems.mockResolvedValue([]);

      const cart = await syncCartOnAuthChange("dtc");
      expect(cart).not.toBeNull();
      expect(cart?.id).toBe("user-cart-existing");
      expect(mockDb.claimOrMergeGuestCart).not.toHaveBeenCalled();
    });

    it("associateCartWithUser explicitly associates and merges cart", async () => {
      mockCookies._store.set("sb-mock-auth-token", "token-xyz");
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: { claims: { sub: "user-123" } },
        error: null,
      });
      mockSpree.getCartToken.mockResolvedValue(rawBearerToken);
      mockDb.claimOrMergeGuestCart.mockResolvedValue({
        ...mockDbCart,
        id: "merged-cart-id",
        user_id: "user-123",
      });

      const result = await associateCartWithUser();
      expect(result).toEqual({ success: true });
      expect(mockDb.claimOrMergeGuestCart).toHaveBeenCalledWith(
        "user-123",
        hashedBearerToken,
        "dtc",
      );
    });
  });
});
