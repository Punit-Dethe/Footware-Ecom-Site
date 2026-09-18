-- ============================================================================
-- Migration: 20260918150000_media_library_content_hash.sql
-- Description: Add optional content_sha256 hash to public.media_assets
--   Supports cryptographic integrity verification, diagnostic auditing,
--   and collision prevention for Media Library uploads.
-- ============================================================================

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS content_sha256 VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_media_assets_content_sha256
  ON public.media_assets (content_sha256)
  WHERE content_sha256 IS NOT NULL;
