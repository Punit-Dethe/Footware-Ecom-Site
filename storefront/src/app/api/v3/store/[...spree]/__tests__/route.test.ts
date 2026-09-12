import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCartData = vi.hoisted(() => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  getOrCreateCart: vi.fn(),
}));

vi.mock("@/lib/data/cart", () => mockCartData);

import { DELETE, GET, PATCH, POST } from "../route";

describe("BFF /api/v3/store/[...spree] Route Handlers", () => {
  const authorizedCart = {
    id: "authorized-cart-uuid",
    items: [],
    item_count: 0,
    total_amount: { amount_in_cents: 0, display_amount: "$0.00" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCartData.getCart.mockResolvedValue(authorizedCart);
  });

  describe("POST /carts/:id/items", () => {
    it("rejects mismatched cartId with 404 and performs no mutation", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/victim-cart-id/items",
        {
          method: "POST",
          body: JSON.stringify({ variant_id: "var-1", quantity: 2 }),
        },
      );

      const params = Promise.resolve({ spree: ["carts", "victim-cart-id", "items"] });
      const res = await POST(req, { params });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Cart not found or unauthorized");
      expect(mockCartData.addToCart).not.toHaveBeenCalled();
    });

    it("succeeds when path cartId matches authorized cart", async () => {
      mockCartData.addToCart.mockResolvedValue({
        success: true,
        cart: { ...authorizedCart, item_count: 2 },
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/authorized-cart-uuid/items",
        {
          method: "POST",
          body: JSON.stringify({ variant_id: "var-1", quantity: 2 }),
        },
      );

      const params = Promise.resolve({ spree: ["carts", "authorized-cart-uuid", "items"] });
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(mockCartData.addToCart).toHaveBeenCalledWith("var-1", 2);
    });
  });

  describe("PATCH /carts/:id/items/:itemId", () => {
    it("rejects mismatched cartId with 404 and performs no mutation", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/victim-cart-id/items/item-1",
        {
          method: "PATCH",
          body: JSON.stringify({ quantity: 5 }),
        },
      );

      const params = Promise.resolve({
        spree: ["carts", "victim-cart-id", "items", "item-1"],
      });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Cart not found or unauthorized");
      expect(mockCartData.updateCartItem).not.toHaveBeenCalled();
    });

    it("succeeds when path cartId matches authorized cart", async () => {
      mockCartData.updateCartItem.mockResolvedValue({
        success: true,
        cart: { ...authorizedCart, item_count: 5 },
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/authorized-cart-uuid/items/item-1",
        {
          method: "PATCH",
          body: JSON.stringify({ quantity: 5 }),
        },
      );

      const params = Promise.resolve({
        spree: ["carts", "authorized-cart-uuid", "items", "item-1"],
      });
      const res = await PATCH(req, { params });

      expect(res.status).toBe(200);
      expect(mockCartData.updateCartItem).toHaveBeenCalledWith("item-1", 5);
    });
  });

  describe("DELETE /carts/:id/items/:itemId", () => {
    it("rejects mismatched cartId with 404 and performs no mutation", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/victim-cart-id/items/item-1",
        {
          method: "DELETE",
        },
      );

      const params = Promise.resolve({
        spree: ["carts", "victim-cart-id", "items", "item-1"],
      });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Cart not found or unauthorized");
      expect(mockCartData.removeCartItem).not.toHaveBeenCalled();
    });

    it("succeeds when path cartId matches authorized cart", async () => {
      mockCartData.removeCartItem.mockResolvedValue({
        success: true,
        cart: { ...authorizedCart, item_count: 0 },
      });

      const req = new NextRequest(
        "http://localhost:3000/api/v3/store/carts/authorized-cart-uuid/items/item-1",
        {
          method: "DELETE",
        },
      );

      const params = Promise.resolve({
        spree: ["carts", "authorized-cart-uuid", "items", "item-1"],
      });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      expect(mockCartData.removeCartItem).toHaveBeenCalledWith("item-1");
    });
  });

  describe("GET /carts/:id", () => {
    it("delegates to getCart with explicit cart id", async () => {
      const req = new NextRequest("http://localhost:3000/api/v3/store/carts/cart-abc");
      const params = Promise.resolve({ spree: ["carts", "cart-abc"] });
      const res = await GET(req, { params });

      expect(res.status).toBe(200);
      expect(mockCartData.getCart).toHaveBeenCalledWith("cart-abc");
    });

    it("returns 404 when getCart returns null", async () => {
      mockCartData.getCart.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/v3/store/carts/cart-denied");
      const params = Promise.resolve({ spree: ["carts", "cart-denied"] });
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
    });
  });
});
