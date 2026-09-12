-- ------------------------------------------------------------------------------
-- B5 Migration: Orders & Order Items First-Party Schema & Cart Checkout State
-- Target: Clean Supabase Project (hkncfdsvgjopkujmmxem)
-- ------------------------------------------------------------------------------

-- 1. Add checkout_email to public.carts
ALTER TABLE public.carts
    ADD COLUMN IF NOT EXISTS checkout_email VARCHAR(255);

-- 2. Add source_cart_id, surface, completed_at to public.orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS source_cart_id UUID
    REFERENCES public.carts(id)
    ON DELETE RESTRICT;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS surface VARCHAR(20) NOT NULL DEFAULT 'dtc'
    CHECK (surface IN ('dtc', 'wholesale'));

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Enforce 1-to-1 idempotency constraint: one cart can become at most one order
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_source_cart_id_key'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_source_cart_id_key UNIQUE (source_cart_id);
    END IF;
END $$;

-- 4. Customer order history index (sorted by completion date descending)
CREATE INDEX IF NOT EXISTS idx_orders_user_completed_at
    ON public.orders (user_id, completed_at DESC);

-- 5. Source cart lookup index
CREATE INDEX IF NOT EXISTS idx_orders_source_cart_id
    ON public.orders (source_cart_id);

-- 6. Maintain strict RLS lockdown on orders and order_items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;
