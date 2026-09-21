-- ------------------------------------------------------------------------------
-- Migration: Orders Payment Metadata (Provider-neutral schema for Razorpay)
-- ------------------------------------------------------------------------------

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_provider_order_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_provider_payment_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Unique constraints for provider references when non-null
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_provider_payment_id_key'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_payment_provider_payment_id_key UNIQUE (payment_provider_payment_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_provider_order_id_key'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_payment_provider_order_id_key UNIQUE (payment_provider_order_id);
    END IF;
END $$;

-- Indexes for provider references lookup
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_order_id
    ON public.orders (payment_provider_order_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_payment_id
    ON public.orders (payment_provider_payment_id);
