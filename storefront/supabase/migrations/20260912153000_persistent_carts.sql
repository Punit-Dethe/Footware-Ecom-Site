-- ------------------------------------------------------------------------------
-- B3 Migration: Persistent Carts & SKU Bridge
-- Target: Clean Supabase Project (hkncfdsvgjopkujmmxem)
-- ------------------------------------------------------------------------------

-- 1. Add surface column to public.carts for DTC/wholesale isolation
ALTER TABLE public.carts
    ADD COLUMN IF NOT EXISTS surface VARCHAR(20) NOT NULL DEFAULT 'dtc'
    CHECK (surface IN ('dtc', 'wholesale'));

-- 2. Replace single active user cart index with per-surface active user cart index
DROP INDEX IF EXISTS public.idx_carts_active_user;

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_active_user_surface
    ON public.carts (user_id, surface)
    WHERE user_id IS NOT NULL AND status = 'active';

-- Ensure index on guest token hash with surface and status
CREATE INDEX IF NOT EXISTS idx_carts_guest_token_surface
    ON public.carts (guest_token_hash, surface)
    WHERE guest_token_hash IS NOT NULL;

-- 3. SKU Bridge for cart_items (decouples cart persistence from database catalog)
ALTER TABLE public.cart_items
    ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(100);

-- Backfill any existing rows if variants table has matching IDs
UPDATE public.cart_items ci
SET variant_sku = v.sku
FROM public.variants v
WHERE ci.variant_id = v.id AND ci.variant_sku IS NULL;

-- Make variant_id nullable for catalog abstraction
ALTER TABLE public.cart_items
    ALTER COLUMN variant_id DROP NOT NULL;

-- Enforce variant_sku NOT NULL
ALTER TABLE public.cart_items
    ALTER COLUMN variant_sku SET NOT NULL;

-- Replace old uniqueness constraint (cart_id, variant_id) with (cart_id, variant_sku)
ALTER TABLE public.cart_items
    DROP CONSTRAINT IF EXISTS cart_items_cart_id_variant_id_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cart_id_variant_sku_key'
    ) THEN
        ALTER TABLE public.cart_items
            ADD CONSTRAINT cart_items_cart_id_variant_sku_key UNIQUE (cart_id, variant_sku);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_sku ON public.cart_items(variant_sku);

-- 4. Maintain strict RLS lockdown
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.carts FROM anon, authenticated;
REVOKE ALL ON TABLE public.cart_items FROM anon, authenticated;
