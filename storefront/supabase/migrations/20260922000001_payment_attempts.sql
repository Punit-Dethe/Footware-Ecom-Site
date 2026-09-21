-- ------------------------------------------------------------------------------
-- Migration: Payment Attempts (Server-side cryptographic binding for Razorpay)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    surface VARCHAR(32) NOT NULL DEFAULT 'dtc',
    provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    provider_order_id VARCHAR(255) NOT NULL UNIQUE,
    provider_payment_id VARCHAR(255) UNIQUE,
    amount_in_cents INT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ
);

-- Index for fast lookup by provider_order_id, cart_id, and surface
CREATE INDEX IF NOT EXISTS idx_payment_attempts_cart_surface
    ON public.payment_attempts (cart_id, surface);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider_order
    ON public.payment_attempts (provider_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider_payment
    ON public.payment_attempts (provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;
