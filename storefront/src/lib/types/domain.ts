/**
 * Domain types for Mirza Footwear application data layer.
 *
 * Represents the PostgreSQL ecommerce domain entities (11 tables).
 * Identity/Auth is managed by Supabase Auth (auth.users).
 */

export type UserRole = "customer" | "admin";

export interface Profile {
  id: string; // references auth.users.id
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_iso: string;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_html: string | null;
  status: ProductStatus;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  size_option: string;
  price_in_cents: number;
  compare_at_price_in_cents: number | null;
  currency: string;
  quantity_on_hand: number;
  backorderable: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Helper to derive in-stock status from quantity_on_hand and backorderable */
export function isVariantInStock(
  variant: Pick<Variant, "quantity_on_hand" | "backorderable">,
): boolean {
  return variant.quantity_on_hand > 0 || variant.backorderable;
}

export interface ProcessedImageVariant {
  format: "avif" | "webp" | "jpeg";
  width: number;
  height: number;
  url: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  is_hero: boolean;
  width: number | null;
  height: number | null;
  dominant_color: string | null;
  lqip: string | null;
  processed_variants: ProcessedImageVariant[] | null;
  created_at: string;
  updated_at: string;
}

export type CartStatus = "active" | "converted" | "abandoned";

export interface Cart {
  id: string;
  user_id: string | null;
  guest_token_hash: string | null;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  billing_address: Record<string, unknown> | null;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartWithItems extends Cart {
  items: Array<
    CartItem & {
      variant: Variant;
      product: Pick<Product, "id" | "name" | "slug">;
      image?: ProductImage;
    }
  >;
}

export type OrderStatus = "placed" | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal_in_cents: number;
  tax_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  shipping_address_snapshot: Record<string, unknown>;
  billing_address_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
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
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
