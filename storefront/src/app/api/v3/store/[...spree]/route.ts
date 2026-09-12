import { type NextRequest, NextResponse } from "next/server";
import {
  CATEGORIES,
  COUNTRIES,
  MARKETS,
  POLICIES,
  getCatalogFilters,
  getCategoryByPermalinkOrId,
  getProductBySlugOrId,
  queryProducts,
} from "@/lib/catalog/catalog-repository";


import {
  addToCart,
  getCart,
  getOrCreateCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/data/cart";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ spree: string[] }> },
) {
  const { spree } = await context.params;
  const path = spree.join("/");
  const { searchParams } = new URL(request.url);

  // 1. Products List: GET /api/v3/store/products
  if (path === "products") {
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 12;
    const q = searchParams.get("q") || searchParams.get("filter[name]") || "";
    const in_category =
      searchParams.get("in_category") ||
      searchParams.get("filter[category_id]") ||
      "";
    const sort = searchParams.get("sort") || "";

    const result = queryProducts({ page, limit, q, in_category, sort });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // 2. Product Filters: GET /api/v3/store/products/filters
  if (path === "products/filters") {
    const in_category =
      searchParams.get("in_category") ||
      searchParams.get("filter[category_id]") ||
      "";
    const filters = getCatalogFilters({ in_category });
    return NextResponse.json(filters, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }

  // 3. Single Product: GET /api/v3/store/products/:slugOrId
  if (path.startsWith("products/")) {
    const slugOrId = path.replace(/^products\//, "");
    const product = getProductBySlugOrId(slugOrId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // 4. Categories List: GET /api/v3/store/categories
  if (path === "categories") {
    return NextResponse.json(
      {
        data: CATEGORIES,
        meta: { count: CATEGORIES.length, total_count: CATEGORIES.length },
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  // 5. Single Category: GET /api/v3/store/categories/:permalinkOrId
  if (path.startsWith("categories/")) {
    const permalinkOrId = path.replace(/^categories\//, "");
    const category = getCategoryByPermalinkOrId(permalinkOrId);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(category, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }

  // 6. Markets List: GET /api/v3/store/markets
  if (path === "markets") {
    return NextResponse.json(
      { data: MARKETS, meta: { count: MARKETS.length } },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  // 7. Market Resolve: GET /api/v3/store/markets/resolve
  if (path === "markets/resolve") {
    const country = searchParams.get("country")?.toLowerCase() || "us";
    const market = MARKETS.find((m) => m.code === country) || MARKETS[0];
    return NextResponse.json(market);
  }

  // 8. Countries List: GET /api/v3/store/countries
  if (path === "countries") {
    return NextResponse.json({
      data: COUNTRIES,
      meta: { count: COUNTRIES.length },
    });
  }

  // 9. Single Country: GET /api/v3/store/countries/:iso
  if (path.startsWith("countries/")) {
    const iso = path.replace(/^countries\//, "").toLowerCase();
    const country = COUNTRIES.find((c) => c.iso === iso) || COUNTRIES[0];
    return NextResponse.json(country);
  }

  // 10. Channel Info: GET /api/v3/store/channel
  if (path === "channel") {
    return NextResponse.json({
      data: {
        id: "chn_mirza",
        code: "mirza",
        name: "Mirza Footwear Global",
        currency: "USD",
        default_locale: "en",
        supported_locales: ["en"],
      },
    });
  }

  // 11. Policies: GET /api/v3/store/policies/:slug
  if (path.startsWith("policies/")) {
    const slug = path.replace(/^policies\//, "");
    const policy = POLICIES.find((p) => p.slug === slug) || POLICIES[0];
    return NextResponse.json(policy);
  }

  if (path === "policies") {
    return NextResponse.json({
      data: POLICIES,
      meta: { count: POLICIES.length },
    });
  }

  // 12. Customers me: GET /api/v3/store/customers/me
  if (path === "customers/me") {
    return NextResponse.json({
      data: {
        id: "usr_mirza_demo",
        email: "customer@mirzafootwear.com",
        first_name: "Mirza",
        last_name: "Patron",
      },
    });
  }

  // 13. Carts Get: GET /api/v3/store/carts/:id or /cart
  if (path.startsWith("carts/") || path === "cart") {
    const cartId = path.startsWith("carts/")
      ? path.replace(/^carts\//, "")
      : undefined;
    const cart = await getCart(cartId);
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }
    return NextResponse.json(cart);
  }

  return NextResponse.json({ data: [], meta: { count: 0 } });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ spree: string[] }> },
) {
  const { spree } = await context.params;
  const path = spree.join("/");
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // empty body
  }

  // 1. Auth login
  if (path === "auth/login") {
    return NextResponse.json({
      token: "demo_jwt_mirza",
      refresh_token: "demo_refresh_mirza",
      user: {
        id: "usr_1",
        email: "customer@mirzafootwear.com",
        first_name: "Mirza",
        last_name: "Patron",
      },
    });
  }

  // 2. Create Cart: POST /api/v3/store/carts
  if (path === "carts") {
    const cart = await getOrCreateCart();
    return NextResponse.json(cart);
  }

  // 3. Add Item to Cart: POST /api/v3/store/carts/:id/items
  if (path.match(/^carts\/[^/]+\/items$/)) {
    const pathCartId = path.split("/")[1];
    const authorizedCart = await getCart();
    if (!authorizedCart || authorizedCart.id !== pathCartId) {
      return NextResponse.json(
        { error: "Cart not found or unauthorized" },
        { status: 404 },
      );
    }

    const variantId = body.variant_id;
    const quantity = Number(body.quantity) || 1;
    const result = await addToCart(variantId, quantity);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to add item to cart" },
        { status: 400 },
      );
    }
    return NextResponse.json(result.cart);
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ spree: string[] }> },
) {
  const { spree } = await context.params;
  const path = spree.join("/");
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // empty body
  }

  // Update Cart Item Quantity: PATCH /api/v3/store/carts/:id/items/:itemId
  if (path.match(/^carts\/[^/]+\/items\/[^/]+$/)) {
    const parts = path.split("/");
    const pathCartId = parts[1];
    const itemId = parts[3];
    const authorizedCart = await getCart();
    if (!authorizedCart || authorizedCart.id !== pathCartId) {
      return NextResponse.json(
        { error: "Cart not found or unauthorized" },
        { status: 404 },
      );
    }

    const quantity = Number(body.quantity) || 1;
    const result = await updateCartItem(itemId, quantity);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update item" },
        { status: 400 },
      );
    }
    return NextResponse.json(result.cart);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ spree: string[] }> },
) {
  const { spree } = await context.params;
  const path = spree.join("/");

  // Remove Item from Cart: DELETE /api/v3/store/carts/:id/items/:itemId
  if (path.match(/^carts\/[^/]+\/items\/[^/]+$/)) {
    const parts = path.split("/");
    const pathCartId = parts[1];
    const itemId = parts[3];
    const authorizedCart = await getCart();
    if (!authorizedCart || authorizedCart.id !== pathCartId) {
      return NextResponse.json(
        { error: "Cart not found or unauthorized" },
        { status: 404 },
      );
    }

    const result = await removeCartItem(itemId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to remove item" },
        { status: 400 },
      );
    }
    return NextResponse.json(result.cart);
  }

  return NextResponse.json({ success: true });
}
