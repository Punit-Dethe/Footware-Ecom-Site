-- ============================================================================
-- Migration: 20260918000000_media_contract_v1.sql
-- Description: Media Contract v1 Foundation
--   1. Introduces public.media_assets (global reusable physical asset metadata)
--   2. Introduces public.product_media (product placement & association)
--   3. Enforces database constraints (single hero, unique placement, restrict delete)
--   4. Backfills legacy public.product_images safely and idempotently
--   5. Preserves public.product_images unchanged for rollback safety
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create public.media_assets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_provider VARCHAR(50) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    width INT,
    height INT,
    dominant_color VARCHAR(30),
    lqip TEXT,
    processed_variants JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_media_assets_provider_path UNIQUE (storage_provider, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_provider
    ON public.media_assets (storage_provider);

CREATE INDEX IF NOT EXISTS idx_media_assets_created_at
    ON public.media_assets (created_at DESC);

-- Enable RLS and revoke access from untrusted browser roles (anon, authenticated)
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.media_assets FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Create public.product_media
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    media_asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
    position INT NOT NULL DEFAULT 0,
    is_hero BOOLEAN NOT NULL DEFAULT FALSE,
    alt_text VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_media_product_asset UNIQUE (product_id, media_asset_id)
);

-- Enforce at most ONE hero image per product at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_single_hero
    ON public.product_media (product_id)
    WHERE is_hero = true;

-- Index for deterministic ordering: position ascending, then created_at ascending
CREATE INDEX IF NOT EXISTS idx_product_media_product_position
    ON public.product_media (product_id, position ASC, created_at ASC);

-- Index for reverse lookup and usage tracking: "where is this asset used?"
CREATE INDEX IF NOT EXISTS idx_product_media_media_asset_id
    ON public.product_media (media_asset_id);

-- Enable RLS and revoke access from untrusted browser roles (anon, authenticated)
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_media FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Idempotent Backfill from legacy public.product_images
-- ----------------------------------------------------------------------------

-- Step 3a: Backfill physical assets into public.media_assets
-- Classifies root-relative /catalog-shoes/... as 'legacy_public', and all others as 'supabase'
INSERT INTO public.media_assets (
    id,
    storage_provider,
    storage_path,
    original_filename,
    mime_type,
    file_size_bytes,
    width,
    height,
    dominant_color,
    lqip,
    processed_variants,
    created_at,
    updated_at
)
SELECT
    pi.id,
    CASE
        WHEN pi.storage_path LIKE '/catalog-shoes/%' THEN 'legacy_public'
        ELSE 'supabase'
    END AS storage_provider,
    pi.storage_path,
    pi.original_filename,
    pi.mime_type,
    pi.file_size_bytes,
    pi.width,
    pi.height,
    pi.dominant_color,
    pi.lqip,
    pi.processed_variants,
    pi.created_at,
    pi.updated_at
FROM public.product_images pi
ON CONFLICT (storage_provider, storage_path) DO NOTHING;

-- Step 3b: Backfill product placement associations into public.product_media
INSERT INTO public.product_media (
    id,
    product_id,
    media_asset_id,
    position,
    is_hero,
    alt_text,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pi.product_id,
    ma.id,
    pi.position,
    pi.is_hero,
    pi.alt_text,
    pi.created_at,
    pi.updated_at
FROM public.product_images pi
JOIN public.media_assets ma
    ON ma.storage_path = pi.storage_path
    AND ma.storage_provider = (
        CASE
            WHEN pi.storage_path LIKE '/catalog-shoes/%' THEN 'legacy_public'
            ELSE 'supabase'
        END
    )
ON CONFLICT (product_id, media_asset_id) DO NOTHING;
