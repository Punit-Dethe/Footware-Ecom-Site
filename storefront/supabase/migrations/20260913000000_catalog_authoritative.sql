-- Migration: 20260913000000_catalog_authoritative.sql
-- Description: Authoritative Catalog Source of Truth & Cart Variant ID Reconnection

-- 1. Schema Additions
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

ALTER TABLE public.variants
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_product_default
ON public.variants(product_id)
WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_variants_active
ON public.variants(active);

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id
ON public.cart_items(variant_id);

-- 2. Seed Categories
INSERT INTO public.categories (name, slug, description, position)
VALUES
  ('Office Wear', 'office-wear', 'Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.', 1),
  ('Traditional', 'traditional', 'Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.', 2)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    position = EXCLUDED.position;

-- 3. Seed Products
INSERT INTO public.products (name, slug, sku, description, description_html, status, meta_title, meta_description, meta_keywords)
VALUES
  ('The Sovereign Wholecut Oxford', 'office-footwear-01', 'MIRZA-OFF-001', 'Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.', '<p>Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.</p>', 'active', 'The Sovereign Wholecut Oxford | Mirza Footwear', 'Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.', 'The Sovereign Wholecut Oxford, handcrafted footwear, luxury leather'),
  ('The Heritage Wingtip Derby', 'office-footwear-02', 'MIRZA-OFF-002', 'Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.', '<p>Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.</p>', 'active', 'The Heritage Wingtip Derby | Mirza Footwear', 'Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.', 'The Heritage Wingtip Derby, handcrafted footwear, luxury leather'),
  ('The Kensington Penny Loafer', 'office-footwear-03', 'MIRZA-OFF-003', 'Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.', '<p>Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.</p>', 'active', 'The Kensington Penny Loafer | Mirza Footwear', 'Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.', 'The Kensington Penny Loafer, handcrafted footwear, luxury leather'),
  ('The Mayfair Chelsea Boot', 'office-footwear-04', 'MIRZA-OFF-004', 'Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.', '<p>Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.</p>', 'active', 'The Mayfair Chelsea Boot | Mirza Footwear', 'Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.', 'The Mayfair Chelsea Boot, handcrafted footwear, luxury leather'),
  ('The Westminster Double Monk Strap', 'office-footwear-05', 'MIRZA-OFF-005', 'Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.', '<p>Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.</p>', 'active', 'The Westminster Double Monk Strap | Mirza Footwear', 'Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.', 'The Westminster Double Monk Strap, handcrafted footwear, luxury leather'),
  ('The Belgravia Cap-Toe Oxford', 'office-footwear-06', 'MIRZA-OFF-006', 'Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.', '<p>Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.</p>', 'active', 'The Belgravia Cap-Toe Oxford | Mirza Footwear', 'Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.', 'The Belgravia Cap-Toe Oxford, handcrafted footwear, luxury leather'),
  ('The Piccadilly Tassel Loafer', 'office-footwear-07', 'MIRZA-OFF-007', 'Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.', '<p>Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.</p>', 'active', 'The Piccadilly Tassel Loafer | Mirza Footwear', 'Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.', 'The Piccadilly Tassel Loafer, handcrafted footwear, luxury leather'),
  ('The St. James Quarter Brogue', 'office-footwear-08', 'MIRZA-OFF-008', 'Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.', '<p>Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.</p>', 'active', 'The St. James Quarter Brogue | Mirza Footwear', 'Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.', 'The St. James Quarter Brogue, handcrafted footwear, luxury leather'),
  ('The Mayfair Chukka Boot', 'office-footwear-09', 'MIRZA-OFF-009', 'Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.', '<p>Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.</p>', 'active', 'The Mayfair Chukka Boot | Mirza Footwear', 'Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.', 'The Mayfair Chukka Boot, handcrafted footwear, luxury leather'),
  ('The Royal Single Monk Strap', 'office-footwear-10', 'MIRZA-OFF-010', 'Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.', '<p>Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.</p>', 'active', 'The Royal Single Monk Strap | Mirza Footwear', 'Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.', 'The Royal Single Monk Strap, handcrafted footwear, luxury leather'),
  ('The Savoy Medallion Oxford', 'office-footwear-11', 'MIRZA-OFF-011', 'Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.', '<p>Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.</p>', 'active', 'The Savoy Medallion Oxford | Mirza Footwear', 'Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.', 'The Savoy Medallion Oxford, handcrafted footwear, luxury leather'),
  ('The Knightsbridge Plain Derby', 'office-footwear-12', 'MIRZA-OFF-012', 'Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.', '<p>Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.</p>', 'active', 'The Knightsbridge Plain Derby | Mirza Footwear', 'Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.', 'The Knightsbridge Plain Derby, handcrafted footwear, luxury leather'),
  ('The Burlington Bit Loafer', 'office-footwear-13', 'MIRZA-OFF-013', 'Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.', '<p>Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.</p>', 'active', 'The Burlington Bit Loafer | Mirza Footwear', 'Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.', 'The Burlington Bit Loafer, handcrafted footwear, luxury leather'),
  ('The Carlton Brogue Derby', 'office-footwear-14', 'MIRZA-OFF-014', 'Country calf brogue derby with heavy perforation detail and durable commando rubber sole.', '<p>Country calf brogue derby with heavy perforation detail and durable commando rubber sole.</p>', 'active', 'The Carlton Brogue Derby | Mirza Footwear', 'Country calf brogue derby with heavy perforation detail and durable commando rubber sole.', 'The Carlton Brogue Derby, handcrafted footwear, luxury leather'),
  ('The Grosvenor Dress Boot', 'office-footwear-15', 'MIRZA-OFF-015', 'Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.', '<p>Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.</p>', 'active', 'The Grosvenor Dress Boot | Mirza Footwear', 'Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.', 'The Grosvenor Dress Boot, handcrafted footwear, luxury leather'),
  ('The Oxford Adelaide Brogue', 'office-footwear-16', 'MIRZA-OFF-016', 'Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.', '<p>Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.</p>', 'active', 'The Oxford Adelaide Brogue | Mirza Footwear', 'Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.', 'The Oxford Adelaide Brogue, handcrafted footwear, luxury leather'),
  ('The Chelsea Goodyear Boot', 'office-footwear-17', 'MIRZA-OFF-017', 'Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.', '<p>Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.</p>', 'active', 'The Chelsea Goodyear Boot | Mirza Footwear', 'Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.', 'The Chelsea Goodyear Boot, handcrafted footwear, luxury leather'),
  ('The Whitehall Executive Loafer', 'office-footwear-18', 'MIRZA-OFF-018', 'Tailored dress loafer designed for all-day comfort with concealed elastic arch support.', '<p>Tailored dress loafer designed for all-day comfort with concealed elastic arch support.</p>', 'active', 'The Whitehall Executive Loafer | Mirza Footwear', 'Tailored dress loafer designed for all-day comfort with concealed elastic arch support.', 'The Whitehall Executive Loafer, handcrafted footwear, luxury leather'),
  ('The Sovereign Split-Toe Derby', 'office-footwear-19', 'MIRZA-OFF-019', 'Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.', '<p>Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.</p>', 'active', 'The Sovereign Split-Toe Derby | Mirza Footwear', 'Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.', 'The Sovereign Split-Toe Derby, handcrafted footwear, luxury leather'),
  ('The Royal Dabka Zardozi Jutti', 'traditional-footwear-20', 'MIRZA-TRD-020', 'Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.', '<p>Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.</p>', 'active', 'The Royal Dabka Zardozi Jutti | Mirza Footwear', 'Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.', 'The Royal Dabka Zardozi Jutti, handcrafted footwear, luxury leather'),
  ('The Ceremonial Velvet Mojari', 'traditional-footwear-21', 'MIRZA-TRD-021', 'Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.', '<p>Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.</p>', 'active', 'The Ceremonial Velvet Mojari | Mirza Footwear', 'Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.', 'The Ceremonial Velvet Mojari, handcrafted footwear, luxury leather'),
  ('The Handcrafted Peshawari Sandal', 'traditional-footwear-22', 'MIRZA-TRD-022', 'Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.', '<p>Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.</p>', 'active', 'The Handcrafted Peshawari Sandal | Mirza Footwear', 'Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.', 'The Handcrafted Peshawari Sandal, handcrafted footwear, luxury leather'),
  ('The Artisan Kolhapuri Chappal', 'traditional-footwear-23', 'MIRZA-TRD-023', 'Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.', '<p>Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.</p>', 'active', 'The Artisan Kolhapuri Chappal | Mirza Footwear', 'Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.', 'The Artisan Kolhapuri Chappal, handcrafted footwear, luxury leather'),
  ('The Maharaja Gold Embroidered Jutti', 'traditional-footwear-24', 'MIRZA-TRD-024', 'Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.', '<p>Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.</p>', 'active', 'The Maharaja Gold Embroidered Jutti | Mirza Footwear', 'Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.', 'The Maharaja Gold Embroidered Jutti, handcrafted footwear, luxury leather'),
  ('The Moghul Silk Brocade Mojari', 'traditional-footwear-25', 'MIRZA-TRD-025', 'Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.', '<p>Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.</p>', 'active', 'The Moghul Silk Brocade Mojari | Mirza Footwear', 'Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.', 'The Moghul Silk Brocade Mojari, handcrafted footwear, luxury leather'),
  ('The Regal Tilla Work Jutti', 'traditional-footwear-26', 'MIRZA-TRD-026', 'Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.', '<p>Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.</p>', 'active', 'The Regal Tilla Work Jutti | Mirza Footwear', 'Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.', 'The Regal Tilla Work Jutti, handcrafted footwear, luxury leather'),
  ('The Classic Leather Peshawari', 'traditional-footwear-27', 'MIRZA-TRD-027', 'Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.', '<p>Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.</p>', 'active', 'The Classic Leather Peshawari | Mirza Footwear', 'Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.', 'The Classic Leather Peshawari, handcrafted footwear, luxury leather'),
  ('The Braided Kolhapuri Slide', 'traditional-footwear-28', 'MIRZA-TRD-028', 'Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.', '<p>Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.</p>', 'active', 'The Braided Kolhapuri Slide | Mirza Footwear', 'Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.', 'The Braided Kolhapuri Slide, handcrafted footwear, luxury leather'),
  ('The Shehnai Wedding Mojari', 'traditional-footwear-29', 'MIRZA-TRD-029', 'Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.', '<p>Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.</p>', 'active', 'The Shehnai Wedding Mojari | Mirza Footwear', 'Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.', 'The Shehnai Wedding Mojari, handcrafted footwear, luxury leather'),
  ('The Noor Jahan Velvet Jutti', 'traditional-footwear-30', 'MIRZA-TRD-030', 'Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.', '<p>Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.</p>', 'active', 'The Noor Jahan Velvet Jutti | Mirza Footwear', 'Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.', 'The Noor Jahan Velvet Jutti, handcrafted footwear, luxury leather'),
  ('The Jodhpur Hand-Tooled Jutti', 'traditional-footwear-31', 'MIRZA-TRD-031', 'Richly embossed leather jutti handcrafted by master artisans in Rajasthan.', '<p>Richly embossed leather jutti handcrafted by master artisans in Rajasthan.</p>', 'active', 'The Jodhpur Hand-Tooled Jutti | Mirza Footwear', 'Richly embossed leather jutti handcrafted by master artisans in Rajasthan.', 'The Jodhpur Hand-Tooled Jutti, handcrafted footwear, luxury leather'),
  ('The Patiala Resham Thread Jutti', 'traditional-footwear-32', 'MIRZA-TRD-032', 'Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.', '<p>Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.</p>', 'active', 'The Patiala Resham Thread Jutti | Mirza Footwear', 'Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.', 'The Patiala Resham Thread Jutti, handcrafted footwear, luxury leather'),
  ('The Awadh Embroidered Khussa', 'traditional-footwear-33', 'MIRZA-TRD-033', 'Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.', '<p>Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.</p>', 'active', 'The Awadh Embroidered Khussa | Mirza Footwear', 'Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.', 'The Awadh Embroidered Khussa, handcrafted footwear, luxury leather'),
  ('The Banarasi Brocade Mojari', 'traditional-footwear-34', 'MIRZA-TRD-034', 'Woven golden zari on royal purple silk fabric, lined with natural goat leather.', '<p>Woven golden zari on royal purple silk fabric, lined with natural goat leather.</p>', 'active', 'The Banarasi Brocade Mojari | Mirza Footwear', 'Woven golden zari on royal purple silk fabric, lined with natural goat leather.', 'The Banarasi Brocade Mojari, handcrafted footwear, luxury leather'),
  ('The Jaipur Block-Print Jutti', 'traditional-footwear-35', 'MIRZA-TRD-035', 'Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.', '<p>Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.</p>', 'active', 'The Jaipur Block-Print Jutti | Mirza Footwear', 'Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.', 'The Jaipur Block-Print Jutti, handcrafted footwear, luxury leather'),
  ('The Vintage Chamba Sandal', 'traditional-footwear-36', 'MIRZA-TRD-036', 'Embroidered leather strappy sandal originating from Himachal heritage traditions.', '<p>Embroidered leather strappy sandal originating from Himachal heritage traditions.</p>', 'active', 'The Vintage Chamba Sandal | Mirza Footwear', 'Embroidered leather strappy sandal originating from Himachal heritage traditions.', 'The Vintage Chamba Sandal, handcrafted footwear, luxury leather'),
  ('The Shahzadi Pearl-Work Jutti', 'traditional-footwear-37', 'MIRZA-TRD-037', 'Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.', '<p>Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.</p>', 'active', 'The Shahzadi Pearl-Work Jutti | Mirza Footwear', 'Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.', 'The Shahzadi Pearl-Work Jutti, handcrafted footwear, luxury leather'),
  ('The Royal Dastarkhan Slip-On', 'traditional-footwear-38', 'MIRZA-TRD-038', 'Casual luxury slip-on jutti designed for festive evenings with effortless comfort.', '<p>Casual luxury slip-on jutti designed for festive evenings with effortless comfort.</p>', 'active', 'The Royal Dastarkhan Slip-On | Mirza Footwear', 'Casual luxury slip-on jutti designed for festive evenings with effortless comfort.', 'The Royal Dastarkhan Slip-On, handcrafted footwear, luxury leather')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    description = EXCLUDED.description,
    description_html = EXCLUDED.description_html,
    status = EXCLUDED.status,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    meta_keywords = EXCLUDED.meta_keywords;

-- 4. Seed Product Categories Join
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-01' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-02' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-03' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-04' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-05' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-06' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-07' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-08' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-09' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-10' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-11' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-12' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-13' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-14' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-15' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-16' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-17' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-18' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'office-footwear-19' AND c.slug = 'office-wear'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-20' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-21' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-22' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-23' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-24' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-25' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-26' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-27' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-28' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-29' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-30' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-31' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-32' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-33' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-34' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-35' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-36' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-37' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p, public.categories c
WHERE p.slug = 'traditional-footwear-38' AND c.slug = 'traditional'
ON CONFLICT (product_id, category_id) DO NOTHING;

-- 5. Seed Variants
INSERT INTO public.variants (product_id, sku, size_option, price_in_cents, compare_at_price_in_cents, currency, quantity_on_hand, backorderable, position, is_default, active)
VALUES
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-01'),
  'MIRZA-OFF-001-7',
  '7',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-01'),
  'MIRZA-OFF-001-8',
  '8',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-01'),
  'MIRZA-OFF-001-9',
  '9',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-01'),
  'MIRZA-OFF-001-10',
  '10',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-02'),
  'MIRZA-OFF-002-7',
  '7',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-02'),
  'MIRZA-OFF-002-8',
  '8',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-02'),
  'MIRZA-OFF-002-9',
  '9',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-02'),
  'MIRZA-OFF-002-10',
  '10',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-03'),
  'MIRZA-OFF-003-7',
  '7',
  24500,
  28175,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-03'),
  'MIRZA-OFF-003-8',
  '8',
  24500,
  28175,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-03'),
  'MIRZA-OFF-003-9',
  '9',
  24500,
  28175,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-03'),
  'MIRZA-OFF-003-10',
  '10',
  24500,
  28175,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-04'),
  'MIRZA-OFF-004-7',
  '7',
  32000,
  36800,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-04'),
  'MIRZA-OFF-004-8',
  '8',
  32000,
  36800,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-04'),
  'MIRZA-OFF-004-9',
  '9',
  32000,
  36800,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-04'),
  'MIRZA-OFF-004-10',
  '10',
  32000,
  36800,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-05'),
  'MIRZA-OFF-005-7',
  '7',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-05'),
  'MIRZA-OFF-005-8',
  '8',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-05'),
  'MIRZA-OFF-005-9',
  '9',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-05'),
  'MIRZA-OFF-005-10',
  '10',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-06'),
  'MIRZA-OFF-006-7',
  '7',
  27500,
  31625,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-06'),
  'MIRZA-OFF-006-8',
  '8',
  27500,
  31625,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-06'),
  'MIRZA-OFF-006-9',
  '9',
  27500,
  31625,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-06'),
  'MIRZA-OFF-006-10',
  '10',
  27500,
  31625,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-07'),
  'MIRZA-OFF-007-7',
  '7',
  25500,
  29325,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-07'),
  'MIRZA-OFF-007-8',
  '8',
  25500,
  29325,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-07'),
  'MIRZA-OFF-007-9',
  '9',
  25500,
  29325,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-07'),
  'MIRZA-OFF-007-10',
  '10',
  25500,
  29325,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-08'),
  'MIRZA-OFF-008-7',
  '7',
  28000,
  32200,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-08'),
  'MIRZA-OFF-008-8',
  '8',
  28000,
  32200,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-08'),
  'MIRZA-OFF-008-9',
  '9',
  28000,
  32200,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-08'),
  'MIRZA-OFF-008-10',
  '10',
  28000,
  32200,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-09'),
  'MIRZA-OFF-009-7',
  '7',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-09'),
  'MIRZA-OFF-009-8',
  '8',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-09'),
  'MIRZA-OFF-009-9',
  '9',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-09'),
  'MIRZA-OFF-009-10',
  '10',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-10'),
  'MIRZA-OFF-010-7',
  '7',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-10'),
  'MIRZA-OFF-010-8',
  '8',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-10'),
  'MIRZA-OFF-010-9',
  '9',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-10'),
  'MIRZA-OFF-010-10',
  '10',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-11'),
  'MIRZA-OFF-011-7',
  '7',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-11'),
  'MIRZA-OFF-011-8',
  '8',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-11'),
  'MIRZA-OFF-011-9',
  '9',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-11'),
  'MIRZA-OFF-011-10',
  '10',
  29500,
  33925,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-12'),
  'MIRZA-OFF-012-7',
  '7',
  26000,
  29900,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-12'),
  'MIRZA-OFF-012-8',
  '8',
  26000,
  29900,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-12'),
  'MIRZA-OFF-012-9',
  '9',
  26000,
  29900,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-12'),
  'MIRZA-OFF-012-10',
  '10',
  26000,
  29900,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-13'),
  'MIRZA-OFF-013-7',
  '7',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-13'),
  'MIRZA-OFF-013-8',
  '8',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-13'),
  'MIRZA-OFF-013-9',
  '9',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-13'),
  'MIRZA-OFF-013-10',
  '10',
  27000,
  31050,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-14'),
  'MIRZA-OFF-014-7',
  '7',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-14'),
  'MIRZA-OFF-014-8',
  '8',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-14'),
  'MIRZA-OFF-014-9',
  '9',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-14'),
  'MIRZA-OFF-014-10',
  '10',
  28500,
  32775,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-15'),
  'MIRZA-OFF-015-7',
  '7',
  34000,
  39100,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-15'),
  'MIRZA-OFF-015-8',
  '8',
  34000,
  39100,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-15'),
  'MIRZA-OFF-015-9',
  '9',
  34000,
  39100,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-15'),
  'MIRZA-OFF-015-10',
  '10',
  34000,
  39100,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-16'),
  'MIRZA-OFF-016-7',
  '7',
  31000,
  35650,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-16'),
  'MIRZA-OFF-016-8',
  '8',
  31000,
  35650,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-16'),
  'MIRZA-OFF-016-9',
  '9',
  31000,
  35650,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-16'),
  'MIRZA-OFF-016-10',
  '10',
  31000,
  35650,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-17'),
  'MIRZA-OFF-017-7',
  '7',
  32500,
  37375,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-17'),
  'MIRZA-OFF-017-8',
  '8',
  32500,
  37375,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-17'),
  'MIRZA-OFF-017-9',
  '9',
  32500,
  37375,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-17'),
  'MIRZA-OFF-017-10',
  '10',
  32500,
  37375,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-18'),
  'MIRZA-OFF-018-7',
  '7',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-18'),
  'MIRZA-OFF-018-8',
  '8',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-18'),
  'MIRZA-OFF-018-9',
  '9',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-18'),
  'MIRZA-OFF-018-10',
  '10',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-19'),
  'MIRZA-OFF-019-7',
  '7',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-19'),
  'MIRZA-OFF-019-8',
  '8',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-19'),
  'MIRZA-OFF-019-9',
  '9',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'office-footwear-19'),
  'MIRZA-OFF-019-10',
  '10',
  29000,
  33350,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-20'),
  'MIRZA-TRD-020-7',
  '7',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-20'),
  'MIRZA-TRD-020-8',
  '8',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-20'),
  'MIRZA-TRD-020-9',
  '9',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-20'),
  'MIRZA-TRD-020-10',
  '10',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-21'),
  'MIRZA-TRD-021-7',
  '7',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-21'),
  'MIRZA-TRD-021-8',
  '8',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-21'),
  'MIRZA-TRD-021-9',
  '9',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-21'),
  'MIRZA-TRD-021-10',
  '10',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-22'),
  'MIRZA-TRD-022-7',
  '7',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-22'),
  'MIRZA-TRD-022-8',
  '8',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-22'),
  'MIRZA-TRD-022-9',
  '9',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-22'),
  'MIRZA-TRD-022-10',
  '10',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-23'),
  'MIRZA-TRD-023-7',
  '7',
  18000,
  20700,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-23'),
  'MIRZA-TRD-023-8',
  '8',
  18000,
  20700,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-23'),
  'MIRZA-TRD-023-9',
  '9',
  18000,
  20700,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-23'),
  'MIRZA-TRD-023-10',
  '10',
  18000,
  20700,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-24'),
  'MIRZA-TRD-024-7',
  '7',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-24'),
  'MIRZA-TRD-024-8',
  '8',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-24'),
  'MIRZA-TRD-024-9',
  '9',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-24'),
  'MIRZA-TRD-024-10',
  '10',
  25000,
  28750,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-25'),
  'MIRZA-TRD-025-7',
  '7',
  23000,
  26450,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-25'),
  'MIRZA-TRD-025-8',
  '8',
  23000,
  26450,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-25'),
  'MIRZA-TRD-025-9',
  '9',
  23000,
  26450,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-25'),
  'MIRZA-TRD-025-10',
  '10',
  23000,
  26450,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-26'),
  'MIRZA-TRD-026-7',
  '7',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-26'),
  'MIRZA-TRD-026-8',
  '8',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-26'),
  'MIRZA-TRD-026-9',
  '9',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-26'),
  'MIRZA-TRD-026-10',
  '10',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-27'),
  'MIRZA-TRD-027-7',
  '7',
  20500,
  23575,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-27'),
  'MIRZA-TRD-027-8',
  '8',
  20500,
  23575,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-27'),
  'MIRZA-TRD-027-9',
  '9',
  20500,
  23575,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-27'),
  'MIRZA-TRD-027-10',
  '10',
  20500,
  23575,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-28'),
  'MIRZA-TRD-028-7',
  '7',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-28'),
  'MIRZA-TRD-028-8',
  '8',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-28'),
  'MIRZA-TRD-028-9',
  '9',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-28'),
  'MIRZA-TRD-028-10',
  '10',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-29'),
  'MIRZA-TRD-029-7',
  '7',
  24000,
  27600,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-29'),
  'MIRZA-TRD-029-8',
  '8',
  24000,
  27600,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-29'),
  'MIRZA-TRD-029-9',
  '9',
  24000,
  27600,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-29'),
  'MIRZA-TRD-029-10',
  '10',
  24000,
  27600,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-30'),
  'MIRZA-TRD-030-7',
  '7',
  22000,
  25300,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-30'),
  'MIRZA-TRD-030-8',
  '8',
  22000,
  25300,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-30'),
  'MIRZA-TRD-030-9',
  '9',
  22000,
  25300,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-30'),
  'MIRZA-TRD-030-10',
  '10',
  22000,
  25300,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-31'),
  'MIRZA-TRD-031-7',
  '7',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-31'),
  'MIRZA-TRD-031-8',
  '8',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-31'),
  'MIRZA-TRD-031-9',
  '9',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-31'),
  'MIRZA-TRD-031-10',
  '10',
  21000,
  24150,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-32'),
  'MIRZA-TRD-032-7',
  '7',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-32'),
  'MIRZA-TRD-032-8',
  '8',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-32'),
  'MIRZA-TRD-032-9',
  '9',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-32'),
  'MIRZA-TRD-032-10',
  '10',
  19500,
  22425,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-33'),
  'MIRZA-TRD-033-7',
  '7',
  23500,
  27025,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-33'),
  'MIRZA-TRD-033-8',
  '8',
  23500,
  27025,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-33'),
  'MIRZA-TRD-033-9',
  '9',
  23500,
  27025,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-33'),
  'MIRZA-TRD-033-10',
  '10',
  23500,
  27025,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-34'),
  'MIRZA-TRD-034-7',
  '7',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-34'),
  'MIRZA-TRD-034-8',
  '8',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-34'),
  'MIRZA-TRD-034-9',
  '9',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-34'),
  'MIRZA-TRD-034-10',
  '10',
  22500,
  25875,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-35'),
  'MIRZA-TRD-035-7',
  '7',
  19000,
  21850,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-35'),
  'MIRZA-TRD-035-8',
  '8',
  19000,
  21850,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-35'),
  'MIRZA-TRD-035-9',
  '9',
  19000,
  21850,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-35'),
  'MIRZA-TRD-035-10',
  '10',
  19000,
  21850,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-36'),
  'MIRZA-TRD-036-7',
  '7',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-36'),
  'MIRZA-TRD-036-8',
  '8',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-36'),
  'MIRZA-TRD-036-9',
  '9',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-36'),
  'MIRZA-TRD-036-10',
  '10',
  18500,
  21275,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-37'),
  'MIRZA-TRD-037-7',
  '7',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-37'),
  'MIRZA-TRD-037-8',
  '8',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-37'),
  'MIRZA-TRD-037-9',
  '9',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-37'),
  'MIRZA-TRD-037-10',
  '10',
  26500,
  30475,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-38'),
  'MIRZA-TRD-038-7',
  '7',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  1,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-38'),
  'MIRZA-TRD-038-8',
  '8',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  2,
  TRUE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-38'),
  'MIRZA-TRD-038-9',
  '9',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  3,
  FALSE,
  TRUE
),
(
  (SELECT id FROM public.products WHERE slug = 'traditional-footwear-38'),
  'MIRZA-TRD-038-10',
  '10',
  21500,
  24725,
  'USD',
  0,
  TRUE,
  4,
  FALSE,
  TRUE
)
ON CONFLICT (sku) DO UPDATE
SET product_id = EXCLUDED.product_id,
    size_option = EXCLUDED.size_option,
    price_in_cents = EXCLUDED.price_in_cents,
    compare_at_price_in_cents = EXCLUDED.compare_at_price_in_cents,
    currency = EXCLUDED.currency,
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    backorderable = EXCLUDED.backorderable,
    position = EXCLUDED.position,
    is_default = EXCLUDED.is_default,
    active = EXCLUDED.active;

-- 6. Cart variant_id Backfill & Enforce NOT NULL
DO $$
DECLARE
  unmatched_count INTEGER;
BEGIN
  SELECT count(*) INTO unmatched_count
  FROM public.cart_items ci
  LEFT JOIN public.variants v ON v.sku = ci.variant_sku
  WHERE v.id IS NULL;

  IF unmatched_count > 0 THEN
    RAISE EXCEPTION 'B6A Migration check failed: % unmatched cart_items variant_sku rows', unmatched_count;
  END IF;
END $$;

UPDATE public.cart_items ci
SET variant_id = v.id
FROM public.variants v
WHERE v.sku = ci.variant_sku
  AND (ci.variant_id IS NULL OR ci.variant_id != v.id);

ALTER TABLE public.cart_items
ALTER COLUMN variant_id SET NOT NULL;

-- 7. Backfill order_items variant_id if any rows exist
UPDATE public.order_items oi
SET variant_id = v.id
FROM public.variants v
WHERE v.sku = oi.sku
  AND oi.variant_id IS NULL;
