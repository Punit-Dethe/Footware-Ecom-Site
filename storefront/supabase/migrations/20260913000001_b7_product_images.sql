-- ============================================================================
-- Migration: 20260913000001_b7_product_images.sql
-- Description: B7 Product Media Schema Enhancements & Storage Bucket
-- ============================================================================

-- 1. Add missing metadata fields to public.product_images
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- 2. Add partial unique index: at most ONE hero image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_single_hero
  ON public.product_images (product_id)
  WHERE is_hero = true;

-- 3. Add unique index on storage_path
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_storage_path
  ON public.product_images (storage_path);

-- 4. Add index on (product_id, position) for deterministic ordering
CREATE INDEX IF NOT EXISTS idx_product_images_product_position
  ON public.product_images (product_id, position);

-- 5. Provision dedicated product-media bucket in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-media',
  'product-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 6. Ensure public read policy exists on storage.objects for product-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Read Product Media'
  ) THEN
    CREATE POLICY "Public Read Product Media"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-media');
  END IF;
END $$;
