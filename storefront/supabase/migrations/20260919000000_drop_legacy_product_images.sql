-- Forward migration: Drop obsolete legacy product_images table
-- In Mirza Phase 9, media is strictly managed by public.media_assets and public.product_media.

DROP TABLE IF EXISTS public.product_images CASCADE;
