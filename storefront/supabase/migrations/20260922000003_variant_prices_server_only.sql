-- Migration: 20260922000003_variant_prices_server_only.sql
-- Description: Restore the server-only commerce data-access posture for variant prices.
-- The previous migration enabled RLS but also added a public SELECT policy. Storefront
-- pricing is served only through first-party server data access, consistent with the
-- rest of the ecommerce tables.

DROP POLICY IF EXISTS "Allow public read access to variant_prices"
  ON public.variant_prices;

REVOKE ALL ON TABLE public.variant_prices FROM anon, authenticated;
