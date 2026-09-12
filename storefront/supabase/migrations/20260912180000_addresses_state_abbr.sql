-- ------------------------------------------------------------------------------
-- B4 Migration: Addresses State Abbreviation & Index
-- Target: Clean Supabase Project (hkncfdsvgjopkujmmxem)
-- ------------------------------------------------------------------------------

-- 1. Add state_abbr to public.addresses for exact round-trip fidelity
ALTER TABLE public.addresses
    ADD COLUMN IF NOT EXISTS state_abbr VARCHAR(10);

-- 2. Create optimized index for listing customer addresses by ownership and default flags
CREATE INDEX IF NOT EXISTS idx_addresses_user_defaults
    ON public.addresses (user_id, is_default_shipping DESC, is_default_billing DESC, created_at DESC);

-- 3. Maintain strict RLS lockdown on public.addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.addresses FROM anon, authenticated;
