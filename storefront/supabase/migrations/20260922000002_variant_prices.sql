-- Migration: 20260922000002_variant_prices.sql
-- Description: Multi-currency variant price lists supporting USD and INR.
-- Preserves existing variants table price columns as base compatibility fields.
-- Price authority moves to public.variant_prices.

CREATE TABLE IF NOT EXISTS public.variant_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL,
    price_in_cents INT NOT NULL CHECK (price_in_cents >= 0),
    compare_at_price_in_cents INT NULL CHECK (
        compare_at_price_in_cents IS NULL OR compare_at_price_in_cents >= 0
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_variant_prices_variant_currency UNIQUE (variant_id, currency)
);

-- Performance indices for currency-specific catalog queries
CREATE INDEX IF NOT EXISTS idx_variant_prices_lookup
    ON public.variant_prices(currency, variant_id);

CREATE INDEX IF NOT EXISTS idx_variant_prices_variant_id
    ON public.variant_prices(variant_id);

-- RLS security: public read, service_role write
ALTER TABLE public.variant_prices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'variant_prices' 
        AND policyname = 'Allow public read access to variant_prices'
    ) THEN
        CREATE POLICY "Allow public read access to variant_prices"
            ON public.variant_prices
            FOR SELECT
            USING (true);
    END IF;
END
$$;

-- 1. Backfill existing USD prices exactly from public.variants
INSERT INTO public.variant_prices (
    variant_id,
    currency,
    price_in_cents,
    compare_at_price_in_cents,
    created_at,
    updated_at
)
SELECT
    id AS variant_id,
    'USD' AS currency,
    price_in_cents,
    compare_at_price_in_cents,
    NOW(),
    NOW()
FROM public.variants
ON CONFLICT (variant_id, currency) DO UPDATE
SET
    price_in_cents = EXCLUDED.price_in_cents,
    compare_at_price_in_cents = EXCLUDED.compare_at_price_in_cents,
    updated_at = NOW();

-- 2. Bootstrap INR prices
-- Source: Mid-market XE / BookMyForex benchmark rate
-- Timestamp: 2026-09-22T01:15:00Z
-- Reference Rate: 1 USD = 88.0 INR
-- Policy: Deterministic whole rupee rounding (no fractional paise):
--         (ROUND(price_in_cents * 0.88)::int * 100) paise
-- Merchant reviewable via admin catalog.
INSERT INTO public.variant_prices (
    variant_id,
    currency,
    price_in_cents,
    compare_at_price_in_cents,
    created_at,
    updated_at
)
SELECT
    id AS variant_id,
    'INR' AS currency,
    (ROUND(price_in_cents * 0.88)::int * 100) AS price_in_cents,
    CASE
        WHEN compare_at_price_in_cents IS NOT NULL
        THEN (ROUND(compare_at_price_in_cents * 0.88)::int * 100)
        ELSE NULL
    END AS compare_at_price_in_cents,
    NOW(),
    NOW()
FROM public.variants
ON CONFLICT (variant_id, currency) DO UPDATE
SET
    price_in_cents = EXCLUDED.price_in_cents,
    compare_at_price_in_cents = EXCLUDED.compare_at_price_in_cents,
    updated_at = NOW();
