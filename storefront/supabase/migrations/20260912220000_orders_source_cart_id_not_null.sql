-- Migration: 20260912220000_orders_source_cart_id_not_null.sql
-- Description: Enforce NOT NULL invariant on public.orders.source_cart_id (B5.1)

ALTER TABLE public.orders
ALTER COLUMN source_cart_id SET NOT NULL;
