-- ==============================================================================
-- Migration: 20260911000000_init_ecommerce_schema.sql
-- Description: Core ecommerce application schema for Mirza Footwear
-- Auth identity is managed strictly by Supabase Auth (auth.users).
-- Application database owns strictly ecommerce domain entities (11 tables).
-- All domain tables are locked down with Row Level Security (RLS).
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ADDRESSES
-- ------------------------------------------------------------------------------
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address1 VARCHAR(255) NOT NULL,
    address2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country_iso VARCHAR(2) NOT NULL DEFAULT 'IN',
    phone VARCHAR(30),
    is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES (Hierarchical via parent_id)
-- ------------------------------------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    description_html TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_status ON public.products(status);

-- ------------------------------------------------------------------------------
-- 5. PRODUCT_CATEGORIES (Many-to-Many join)
-- ------------------------------------------------------------------------------
CREATE TABLE public.product_categories (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_category_id ON public.product_categories(category_id);

-- ------------------------------------------------------------------------------
-- 6. VARIANTS (With inline inventory tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE public.variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    size_option VARCHAR(20) NOT NULL,
    price_in_cents INT NOT NULL CHECK (price_in_cents >= 0),
    compare_at_price_in_cents INT CHECK (compare_at_price_in_cents IS NULL OR compare_at_price_in_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    backorderable BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product_id ON public.variants(product_id);

-- ------------------------------------------------------------------------------
-- 7. PRODUCT_IMAGES
-- ------------------------------------------------------------------------------
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    position INT NOT NULL DEFAULT 0,
    is_hero BOOLEAN NOT NULL DEFAULT FALSE,
    width INT,
    height INT,
    dominant_color VARCHAR(30),
    lqip TEXT,
    processed_variants JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- ------------------------------------------------------------------------------
-- 8. CARTS (Durable guest + authenticated carts)
-- ------------------------------------------------------------------------------
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_token_hash VARCHAR(255),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    shipping_address JSONB,
    billing_address JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_guest_token_hash ON public.carts(guest_token_hash);

-- Active cart uniqueness guarantees
CREATE UNIQUE INDEX idx_carts_active_guest_token
    ON public.carts (guest_token_hash)
    WHERE guest_token_hash IS NOT NULL AND status = 'active';

CREATE UNIQUE INDEX idx_carts_active_user
    ON public.carts (user_id)
    WHERE user_id IS NOT NULL AND status = 'active';

-- ------------------------------------------------------------------------------
-- 9. CART_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);

-- ------------------------------------------------------------------------------
-- 10. ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'cancelled')),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    subtotal_in_cents INT NOT NULL CHECK (subtotal_in_cents >= 0),
    tax_in_cents INT NOT NULL DEFAULT 0 CHECK (tax_in_cents >= 0),
    shipping_in_cents INT NOT NULL DEFAULT 0 CHECK (shipping_in_cents >= 0),
    total_in_cents INT NOT NULL CHECK (total_in_cents >= 0),
    shipping_address_snapshot JSONB NOT NULL,
    billing_address_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ------------------------------------------------------------------------------
-- 11. ORDER_ITEMS (Immutable historical purchase snapshot)
-- ------------------------------------------------------------------------------
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    size_option VARCHAR(20) NOT NULL,
    price_in_cents INT NOT NULL CHECK (price_in_cents >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_in_cents INT NOT NULL CHECK (total_in_cents >= 0),
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) LOCKDOWN
-- Prevent direct client-side/browser access through publishable/anon keys.
-- All ecommerce mutations and queries occur through Server Actions using the pooled connection.
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke table permissions from anon and authenticated browser roles
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.addresses FROM anon, authenticated;
REVOKE ALL ON TABLE public.categories FROM anon, authenticated;
REVOKE ALL ON TABLE public.products FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_categories FROM anon, authenticated;
REVOKE ALL ON TABLE public.variants FROM anon, authenticated;
REVOKE ALL ON TABLE public.product_images FROM anon, authenticated;
REVOKE ALL ON TABLE public.carts FROM anon, authenticated;
REVOKE ALL ON TABLE public.cart_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
