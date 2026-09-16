import { describe, expect, it } from "vitest";
import { mergeUniqueProducts } from "@/lib/utils/product-list";
import type { Product } from "@/types/commerce";

function product(id: string): Product {
  return { id, name: `Product ${id}` } as Product;
}

describe("mergeUniqueProducts", () => {
  it("deduplicates an overlapping deferred response", () => {
    const result = mergeUniqueProducts(
      [product("1"), product("2")],
      [product("2"), product("3"), product("3")],
      3,
    );

    expect(result.map(({ id }) => id)).toEqual(["1", "2", "3"]);
  });

  it("never renders more cards than the active query total", () => {
    const result = mergeUniqueProducts(
      [product("1"), product("2")],
      [product("3"), product("4"), product("5")],
      3,
    );

    expect(result.map(({ id }) => id)).toEqual(["1", "2", "3"]);
  });
});
