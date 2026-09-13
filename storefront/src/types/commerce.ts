/**
 * First-Party Commerce Types
 *
 * Narrowly-scoped domain models reflecting Mirza/storefront ownership,
 * replacing external commerce SDK interfaces.
 */

import type { AppUser } from "@/lib/data/customer";
import type {
  CatalogCategory,
  CatalogMedia,
  CatalogOptionType,
  CatalogOptionValue,
  CatalogProduct,
  CatalogVariant,
} from "@/lib/catalog/catalog-repository";
import type { StoreState } from "@/lib/catalog/store-config";

// --- Catalog Types ---
export type Product = CatalogProduct & {
  custom_fields?: CustomField[];
};
export type Variant = CatalogVariant;
export type Media = CatalogMedia;
export type OptionType = CatalogOptionType;
export type OptionValue = CatalogOptionValue;
export type Category = CatalogCategory & {
  is_root?: boolean;
  image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  description_html?: string | null;
};

export interface ProductListParams {
  page?: number;
  limit?: number;
  offset?: number;
  q?: string;
  search?: string;
  in_category?: string;
  category_id?: string;
  sort?: string;
  filter?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

// --- Geographic & Market Types ---
export type State = StoreState;

export interface Country {
  iso: string;
  name: string;
  iso3?: string;
  currency?: string;
  default_locale?: string;
  states_required?: boolean;
  zipcode_required?: boolean;
  states?: State[];
}

export interface Market {
  id: string;
  code: string;
  name: string;
  currency?: string;
  currencies?: string[];
  default_currency?: string;
  default_locale: string;
  supported_locales: string[];
  country_isos?: string[];
  countries?: Country[];
  default?: boolean;
}

export interface Policy {
  id: string;
  name: string;
  slug: string;
  body: string | null;
  body_html: string | null;
}

// --- Customer & Channel Types ---
export type Customer = AppUser;

export interface Channel {
  id: string;
  code: string;
  name: string;
  currency: string;
  default_locale: string;
  supported_locales: string[];
  storefront_access?: string;
}

// --- Address Types ---
export interface Address {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name?: string;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  country_iso: string;
  country_name?: string;
  state_abbr: string | null;
  state_name: string | null;
  state_text?: string;
  quick_checkout?: boolean;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface AddressParams {
  first_name?: string;
  last_name?: string;
  company?: string | null;
  address1?: string;
  address2?: string | null;
  city?: string;
  postal_code?: string;
  phone?: string | null;
  country_iso?: string;
  state_name?: string;
  state_abbr?: string;
  quick_checkout?: boolean;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

// --- Cart & LineItem Types ---
export interface LineItem {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  variant_id?: string;
  quantity: number;
  price?: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents?: number;
  } | string;
  display_price?: string;
  compare_at_amount?: string | null;
  display_compare_at_amount?: string | null;
  total?: {
    amount_in_cents?: number;
    display_amount: string;
  };
  display_total?: string;
  discount_total?: string;
  thumbnail_url?: string | null;
  options_text?: string | null;
}

export interface DeliveryRate {
  id: string;
  name: string;
  cost?: string;
  display_cost?: string;
  selected?: boolean;
}

export interface Fulfillment {
  id: string;
  number?: string;
  status?: string;
  fulfilled_at?: string | null;
  tracking?: string | null;
  tracking_url?: string | null;
  delivery_method?: { name: string } | null;
  display_cost?: string;
  delivery_rates: DeliveryRate[];
  stock_location?: { name: string } | null;
  items?: Array<{
    item_id?: string;
    variant_id?: string;
    quantity: number;
  }>;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type?: string;
  session_required?: boolean;
  description?: string;
}

export interface Cart {
  id: string;
  number?: string;
  token?: string;
  email?: string | null;
  currency: string;
  locale?: string;
  channel_id?: string;
  item_count: number;
  total_quantity: number;
  total: string;
  display_total: string;
  item_total?: { display_amount: string; amount_in_cents: number };
  display_item_total?: string;
  total_amount?: { display_amount: string; amount_in_cents: number };
  ship_total?: { display_amount: string; amount_in_cents: number };
  delivery_total?: string;
  display_delivery_total?: string;
  tax_total?: string;
  display_tax_total?: string;
  promo_total?: { display_amount: string; amount_in_cents: number };
  display_promo_total?: string;
  discount_total?: string;
  display_discount_total?: string;
  store_credit_total?: string;
  display_store_credit_total?: string;
  gift_card?: boolean;
  gift_card_total?: string;
  display_gift_card_total?: string;
  amount_due?: string;
  display_amount_due?: string;
  current_step?: string;
  state?: string;
  items: LineItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  fulfillments?: Fulfillment[];
  payment_methods?: PaymentMethod[];
  payments?: Payment[];
  requirements?: Array<{ step: string; message: string }>;
  coupon_code?: string;
  discounts?: Array<{ label?: string; amount?: string }>;
}

export interface CreateCartParams {
  currency?: string;
  channel_id?: string;
}

// --- Order Types ---
export interface Order {
  id: string;
  number: string;
  token?: string;
  email: string;
  currency: string;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  customer_note?: string | null;
  item_total: string;
  display_item_total: string;
  delivery_total: string;
  display_delivery_total: string;
  tax_total: string;
  display_tax_total: string;
  discount_total?: string;
  display_discount_total?: string;
  store_credit_total?: string;
  display_store_credit_total?: string;
  gift_card?: boolean;
  gift_card_total?: string;
  display_gift_card_total?: string;
  total: string;
  display_total: string;
  amount_due?: string;
  display_amount_due?: string;
  completed_at: string;
  created_at: string;
  updated_at?: string;
  items: LineItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  fulfillments?: Fulfillment[];
  payments?: Payment[];
  discounts?: Array<{ label?: string; amount?: string }>;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
}

// --- Legacy / Dormant Account Types ---
export interface CreditCard {
  id: string;
  brand: string;
  last4: string;
  month: number | string;
  year: number | string;
  name?: string | null;
  default?: boolean;
}

export interface GiftCard {
  id: string;
  code: string;
  amount: string | number;
  amount_used?: string | number;
  display_amount?: string;
  display_amount_used?: string;
  display_amount_remaining?: string;
  status: string;
  active: boolean;
  expired: boolean;
  expires_at?: string | null;
  redeemed_at?: string | null;
}

// --- Filter & Search Types ---
export interface FilterOption {
  id: string;
  name: string;
  slug?: string;
  label?: string;
  count?: number;
  active?: boolean;
  image_url?: string | null;
  color_code?: string | null;
}

export interface OptionFilter {
  id: string;
  name: string;
  label?: string;
  type: "option";
  kind?: string;
  options: FilterOption[];
}

export interface AvailabilityFilter {
  id: string;
  name: string;
  type: "availability";
  options: Array<{ id: string; name: string; count?: number }>;
}

export interface PriceRangeFilter {
  id: string;
  name: string;
  type: "price_range";
  min: number;
  max: number;
  currency?: string;
}

export interface CategoryFilter {
  id: string;
  name: string;
  label?: string;
  type: "category";
  options: FilterOption[];
}

export type ProductFilter =
  | OptionFilter
  | AvailabilityFilter
  | PriceRangeFilter
  | CategoryFilter
  | { id: string; name: string; type: string; [key: string]: unknown };

export interface ProductFiltersResponse {
  filters: ProductFilter[];
  sort_options?: Array<{ id: string; label: string }>;
  default_sort?: string;
  data?: ProductFilter[];
  meta?: { count: number };
}

// --- Custom Field & Order Payment Types ---
export interface CustomField {
  id: string | number;
  label: string;
  field_type?:
    | "boolean"
    | "json"
    | "rich_text"
    | "short_text"
    | "long_text"
    | "number"
    | string;
  value: unknown;
}

export interface StoreCredit {
  id: string;
  amount?: string | number;
  display_amount?: string;
  display_amount_remaining?: string;
}

export interface Payment {
  id: string;
  source_type?: string;
  source?: unknown;
  amount?: string;
  display_amount?: string;
  status?: string;
  payment_method?: { name: string } | null;
}

// --- Pagination Types ---
export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total_count?: number;
    total_pages?: number;
    current_page?: number;
    per_page?: number;
    count?: number;
    page?: number;
    limit?: number;
  };
  pagination?: {
    count?: number;
    total_count?: number;
    page?: number;
    pages?: number;
    per_page?: number;
  };
}

