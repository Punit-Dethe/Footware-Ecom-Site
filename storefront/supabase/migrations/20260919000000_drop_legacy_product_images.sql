-- Forward migration: Drop obsolete legacy product_images table
-- In Mirza Phase 9, media is strictly managed by public.media_assets and public.product_media.
-- No CASCADE: if dependencies exist, PostgreSQL will refuse the drop and the dependency must
-- be investigated and resolved explicitly.

DROP TABLE IF EXISTS public.product_images;
