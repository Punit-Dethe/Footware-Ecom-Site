import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required to run seed_new_catalog.mjs");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Load the image manifest
const manifestPath = path.resolve('scripts/images/manifest.json');
let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

const OFFICE_PRODUCTS = [
  { name: 'The Sovereign Wholecut Oxford', price: 285.00, sku: 'MIRZA-OFF-001', desc: 'Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.' },
  { name: 'The Heritage Wingtip Derby', price: 265.00, sku: 'MIRZA-OFF-002', desc: 'Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.' },
  { name: 'The Kensington Penny Loafer', price: 245.00, sku: 'MIRZA-OFF-003', desc: 'Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.' },
  { name: 'The Mayfair Chelsea Boot', price: 320.00, sku: 'MIRZA-OFF-004', desc: 'Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.' },
  { name: 'The Westminster Double Monk Strap', price: 295.00, sku: 'MIRZA-OFF-005', desc: 'Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.' },
  { name: 'The Belgravia Cap-Toe Oxford', price: 275.00, sku: 'MIRZA-OFF-006', desc: 'Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.' },
  { name: 'The Piccadilly Tassel Loafer', price: 255.00, sku: 'MIRZA-OFF-007', desc: 'Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.' },
  { name: 'The St. James Quarter Brogue', price: 280.00, sku: 'MIRZA-OFF-008', desc: 'Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.' },
  { name: 'The Mayfair Chukka Boot', price: 290.00, sku: 'MIRZA-OFF-009', desc: 'Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.' },
  { name: 'The Royal Single Monk Strap', price: 270.00, sku: 'MIRZA-OFF-010', desc: 'Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.' },
  { name: 'The Savoy Medallion Oxford', price: 295.00, sku: 'MIRZA-OFF-011', desc: 'Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.' },
  { name: 'The Knightsbridge Plain Derby', price: 260.00, sku: 'MIRZA-OFF-012', desc: 'Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.' },
  { name: 'The Burlington Bit Loafer', price: 270.00, sku: 'MIRZA-OFF-013', desc: 'Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.' },
  { name: 'The Carlton Brogue Derby', price: 285.00, sku: 'MIRZA-OFF-014', desc: 'Country calf brogue derby with heavy perforation detail and durable commando rubber sole.' },
  { name: 'The Grosvenor Dress Boot', price: 340.00, sku: 'MIRZA-OFF-015', desc: 'Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.' },
  { name: 'The Oxford Adelaide Brogue', price: 310.00, sku: 'MIRZA-OFF-016', desc: 'Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.' },
  { name: 'The Chelsea Goodyear Boot', price: 325.00, sku: 'MIRZA-OFF-017', desc: 'Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.' },
  { name: 'The Whitehall Executive Loafer', price: 250.00, sku: 'MIRZA-OFF-018', desc: 'Tailored dress loafer designed for all-day comfort with concealed elastic arch support.' },
  { name: 'The Sovereign Split-Toe Derby', price: 290.00, sku: 'MIRZA-OFF-019', desc: 'Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.' }
];

const TRADITIONAL_PRODUCTS = [
  { name: 'The Royal Dabka Zardozi Jutti', price: 210.00, sku: 'MIRZA-TRD-020', desc: 'Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.' },
  { name: 'The Ceremonial Velvet Mojari', price: 225.00, sku: 'MIRZA-TRD-021', desc: 'Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.' },
  { name: 'The Handcrafted Peshawari Sandal', price: 195.00, sku: 'MIRZA-TRD-022', desc: 'Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.' },
  { name: 'The Artisan Kolhapuri Chappal', price: 180.00, sku: 'MIRZA-TRD-023', desc: 'Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.' },
  { name: 'The Maharaja Gold Embroidered Jutti', price: 250.00, sku: 'MIRZA-TRD-024', desc: 'Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.' },
  { name: 'The Moghul Silk Brocade Mojari', price: 230.00, sku: 'MIRZA-TRD-025', desc: 'Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.' },
  { name: 'The Regal Tilla Work Jutti', price: 215.00, sku: 'MIRZA-TRD-026', desc: 'Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.' },
  { name: 'The Classic Leather Peshawari', price: 205.00, sku: 'MIRZA-TRD-027', desc: 'Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.' },
  { name: 'The Braided Kolhapuri Slide', price: 185.00, sku: 'MIRZA-TRD-028', desc: 'Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.' },
  { name: 'The Shehnai Wedding Mojari', price: 240.00, sku: 'MIRZA-TRD-029', desc: 'Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.' },
  { name: 'The Noor Jahan Velvet Jutti', price: 220.00, sku: 'MIRZA-TRD-030', desc: 'Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.' },
  { name: 'The Jodhpur Hand-Tooled Jutti', price: 210.00, sku: 'MIRZA-TRD-031', desc: 'Richly embossed leather jutti handcrafted by master artisans in Rajasthan.' },
  { name: 'The Patiala Resham Thread Jutti', price: 195.00, sku: 'MIRZA-TRD-032', desc: 'Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.' },
  { name: 'The Awadh Embroidered Khussa', price: 235.00, sku: 'MIRZA-TRD-033', desc: 'Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.' },
  { name: 'The Banarasi Brocade Mojari', price: 225.00, sku: 'MIRZA-TRD-034', desc: 'Woven golden zari on royal purple silk fabric, lined with natural goat leather.' },
  { name: 'The Jaipur Block-Print Jutti', price: 190.00, sku: 'MIRZA-TRD-035', desc: 'Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.' },
  { name: 'The Vintage Chamba Sandal', price: 185.00, sku: 'MIRZA-TRD-036', desc: 'Embroidered leather strappy sandal originating from Himachal heritage traditions.' },
  { name: 'The Shahzadi Pearl-Work Jutti', price: 265.00, sku: 'MIRZA-TRD-037', desc: 'Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.' },
  { name: 'The Royal Dastarkhan Slip-On', price: 215.00, sku: 'MIRZA-TRD-038', desc: 'Casual luxury slip-on jutti designed for festive evenings with effortless comfort.' }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('--- Cleaning Up Old Catalog ---');
    // Delete existing product associations and products
    await client.query('DELETE FROM spree_products_taxons;');
    await client.query('DELETE FROM spree_product_publications;');
    await client.query('DELETE FROM spree_products_stores;');
    await client.query('DELETE FROM spree_prices;');
    await client.query('DELETE FROM spree_stock_items;');
    await client.query('DELETE FROM spree_product_translations;');
    await client.query('DELETE FROM spree_variants;');
    await client.query('DELETE FROM spree_products;');

    // Clean up old taxons except root Categories
    await client.query(`
      DELETE FROM spree_taxon_translations 
      WHERE spree_taxon_id IN (SELECT id FROM spree_taxons WHERE parent_id IS NOT NULL);
    `);
    await client.query('DELETE FROM spree_taxons WHERE parent_id IS NOT NULL;');

    console.log('Old catalog and child taxons wiped cleanly.');

    // 1. Ensure Taxonomy "Categories"
    let taxRes = await client.query("SELECT id FROM spree_taxonomies WHERE name = 'Categories' AND store_id = 1;");
    let taxonomyId;
    if (taxRes.rows.length === 0) {
      const insTax = await client.query(
        "INSERT INTO spree_taxonomies (name, store_id, position, created_at, updated_at) VALUES ('Categories', 1, 1, NOW(), NOW()) RETURNING id;"
      );
      taxonomyId = insTax.rows[0].id;
    } else {
      taxonomyId = taxRes.rows[0].id;
    }

    // 2. Ensure Root Taxon "Categories"
    let rootRes = await client.query("SELECT id FROM spree_taxons WHERE taxonomy_id = $1 AND parent_id IS NULL;", [taxonomyId]);
    let rootTaxonId;
    if (rootRes.rows.length === 0) {
      const insRoot = await client.query(
        "INSERT INTO spree_taxons (name, taxonomy_id, parent_id, permalink, pretty_name, position, lft, rgt, depth, store_id, created_at, updated_at) VALUES ('Categories', $1, NULL, 'categories', 'Categories', 1, 1, 6, 0, 1, NOW(), NOW()) RETURNING id;",
        [taxonomyId]
      );
      rootTaxonId = insRoot.rows[0].id;
    } else {
      rootTaxonId = rootRes.rows[0].id;
      await client.query("UPDATE spree_taxons SET lft = 1, rgt = 6 WHERE id = $1;", [rootTaxonId]);
    }

    // 3. Create the TWO exact requested Categories: Office Wear and Traditional
    console.log('--- Creating Categories: Office Wear & Traditional ---');
    const categoriesToCreate = [
      { name: 'Office Wear', slug: 'office-wear', lft: 2, rgt: 3 },
      { name: 'Traditional', slug: 'traditional', lft: 4, rgt: 5 }
    ];

    const taxonMap = {};

    for (const cat of categoriesToCreate) {
      const permalink = `categories/${cat.slug}`;
      const prettyName = `Categories -> ${cat.name}`;

      const insCat = await client.query(
        `INSERT INTO spree_taxons (name, taxonomy_id, parent_id, permalink, pretty_name, position, lft, rgt, depth, store_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6, $7, 1, 1, NOW(), NOW()) RETURNING id;`,
        [cat.name, taxonomyId, rootTaxonId, permalink, prettyName, cat.lft, cat.rgt]
      );
      const catId = insCat.rows[0].id;

      await client.query(
        `INSERT INTO spree_taxon_translations (spree_taxon_id, locale, name, permalink, pretty_name, created_at, updated_at)
         VALUES ($1, 'en', $2, $3, $4, NOW(), NOW());`,
        [catId, cat.name, permalink, prettyName]
      );

      taxonMap[cat.name] = catId;
      console.log(`Created Taxon: ${cat.name} (ID: ${catId}, permalink: ${permalink})`);
    }

    // 4. Seed all 38 products
    console.log('--- Seeding 38 Footwear Products ---');

    const allProducts = [
      ...OFFICE_PRODUCTS.map((p, idx) => ({ ...p, category: 'Office Wear', slug: `office-footwear-${String(idx + 1).padStart(2, '0')}` })),
      ...TRADITIONAL_PRODUCTS.map((p, idx) => ({ ...p, category: 'Traditional', slug: `traditional-footwear-${String(idx + 20).padStart(2, '0')}` }))
    ];

    for (let i = 0; i < allProducts.length; i++) {
      const item = allProducts[i];
      const imageInfo = manifest[item.slug];
      const metadata = imageInfo ? {
        media: {
          mainUrl: imageInfo.mainUrl,
          dominantColor: imageInfo.dominantColor,
          lqip: imageInfo.lqip,
          hash: imageInfo.hash,
          variants: imageInfo.variants
        }
      } : {};

      const insProd = await client.query(
        `INSERT INTO spree_products (
          name, description, slug, available_on, make_active_at, status,
          shipping_category_id, store_id, promotionable, variant_count,
          public_metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NOW() - interval '1 day', NOW() - interval '1 day', 'active',
          1, 1, true, 1,
          $4, NOW(), NOW()
        ) RETURNING id;`,
        [item.name, item.desc, item.slug, JSON.stringify(metadata)]
      );
      const productId = insProd.rows[0].id;

      // Translations
      await client.query(
        `INSERT INTO spree_product_translations (spree_product_id, locale, name, description, slug, created_at, updated_at)
         VALUES ($1, 'en', $2, $3, $4, NOW(), NOW());`,
        [productId, item.name, item.desc, item.slug]
      );

      // Master Variant
      const insVar = await client.query(
        `INSERT INTO spree_variants (
          product_id, sku, is_master, track_inventory, position,
          created_at, updated_at
        ) VALUES (
          $1, $2, true, true, 1,
          NOW(), NOW()
        ) RETURNING id;`,
        [productId, item.sku]
      );
      const variantId = insVar.rows[0].id;

      // Price
      await client.query(
        `INSERT INTO spree_prices (variant_id, amount, currency, created_at, updated_at)
         VALUES ($1, $2, 'USD', NOW(), NOW());`,
        [variantId, item.price]
      );

      // Stock
      await client.query(
        `INSERT INTO spree_stock_items (stock_location_id, variant_id, count_on_hand, backorderable, created_at, updated_at)
         VALUES (1, $1, 50, true, NOW(), NOW());`,
        [variantId]
      );

      // Taxons: Category taxon + Root taxon
      const catTaxonId = taxonMap[item.category];
      await client.query(
        `INSERT INTO spree_products_taxons (product_id, taxon_id, position, created_at, updated_at)
         VALUES ($1, $2, 1, NOW(), NOW());`,
        [productId, catTaxonId]
      );
      await client.query(
        `INSERT INTO spree_products_taxons (product_id, taxon_id, position, created_at, updated_at)
         VALUES ($1, $2, 1, NOW(), NOW());`,
        [productId, rootTaxonId]
      );

      // Store
      await client.query(
        `INSERT INTO spree_products_stores (product_id, store_id, created_at, updated_at)
         VALUES ($1, 1, NOW(), NOW());`,
        [productId]
      );

      // Publications: Channel 1 (Online) and Channel 2 (Wholesale)
      await client.query(
        `INSERT INTO spree_product_publications (channel_id, product_id, published_at, created_at, updated_at)
         VALUES (1, $1, NOW() - interval '1 day', NOW(), NOW());`,
        [productId]
      );
      await client.query(
        `INSERT INTO spree_product_publications (channel_id, product_id, published_at, created_at, updated_at)
         VALUES (2, $1, NOW() - interval '1 day', NOW(), NOW());`,
        [productId]
      );

      console.log(`[${i + 1}/${allProducts.length}] Seeded: ${item.name} | SKU: ${item.sku} | Cat: ${item.category} | Image: ${imageInfo?.mainUrl || 'none'}`);
    }

    await client.query('COMMIT');
    console.log('\nSUCCESS! All 38 products and 2 categories (Office Wear, Traditional) seeded into Supabase PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
