import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required to run seed_catalog.mjs");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const CATALOG = [
  {
    name: 'The Sovereign Cap-Toe Oxford',
    slug: 'sovereign-cap-toe-oxford',
    sku: 'MIRZA-OX-001',
    price: 285.00,
    category: 'Oxfords',
    categorySlug: 'oxfords',
    description: 'Handcrafted from full-grain calfskin leather with a Goodyear-welted leather sole. Features traditional closed lacing and understated brogue detailing at the cap toe.'
  },
  {
    name: 'The Heritage Wingtip Derby',
    slug: 'heritage-wingtip-derby',
    sku: 'MIRZA-DB-002',
    price: 265.00,
    category: 'Derbies',
    categorySlug: 'derbies',
    description: 'Classic open-laced derby featuring intricate wingtip broguing, premium burnished chestnut calfskin, and a stacked leather heel.'
  },
  {
    name: 'The Kensington Penny Loafer',
    slug: 'kensington-penny-loafer',
    sku: 'MIRZA-LF-003',
    price: 245.00,
    category: 'Loafers',
    categorySlug: 'loafers',
    description: 'Timeless slip-on silhouette crafted from rich Italian suede with hand-stitched apron detailing and a flexible Blake-stitched leather sole.'
  },
  {
    name: 'The Mayfair Chelsea Boot',
    slug: 'mayfair-chelsea-boot',
    sku: 'MIRZA-CB-004',
    price: 320.00,
    category: 'Chelsea Boots',
    categorySlug: 'chelsea-boots',
    description: 'Sleek, ankle-high Chelsea boot in supple espresso leather with elasticated side gussets, dual pull tabs, and a storm-welted rubber sole.'
  },
  {
    name: 'The Westminster Double Monk Strap',
    slug: 'westminster-double-monk-strap',
    sku: 'MIRZA-MS-005',
    price: 295.00,
    category: 'Monk Straps',
    categorySlug: 'monk-straps',
    description: 'Elegant double buckle monk strap shoe featuring polished brass buckles, hand-burnished burgundy leather, and Goodyear-welt construction.'
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Taxonomy: Categories
    let taxRes = await client.query("SELECT id FROM spree_taxonomies WHERE name = 'Categories' AND store_id = 1;");
    let taxonomyId;
    if (taxRes.rows.length === 0) {
      const insertedTax = await client.query(
        `INSERT INTO spree_taxonomies (name, store_id, position, created_at, updated_at)
         VALUES ('Categories', 1, 1, NOW(), NOW()) RETURNING id;`
      );
      taxonomyId = insertedTax.rows[0].id;
      await client.query(
        `INSERT INTO spree_taxonomy_translations (spree_taxonomy_id, locale, name, created_at, updated_at)
         VALUES ($1, 'en', 'Categories', NOW(), NOW());`,
        [taxonomyId]
      );
    } else {
      taxonomyId = taxRes.rows[0].id;
    }
    console.log('Taxonomy ID:', taxonomyId);

    // 2. Root Taxon: Categories
    let rootRes = await client.query("SELECT id FROM spree_taxons WHERE taxonomy_id = $1 AND parent_id IS NULL;", [taxonomyId]);
    let rootTaxonId;
    if (rootRes.rows.length === 0) {
      const insertedRoot = await client.query(
        `INSERT INTO spree_taxons (name, taxonomy_id, parent_id, permalink, pretty_name, position, lft, rgt, depth, store_id, created_at, updated_at)
         VALUES ('Categories', $1, NULL, 'categories', 'Categories', 1, 1, 12, 0, 1, NOW(), NOW()) RETURNING id;`,
        [taxonomyId]
      );
      rootTaxonId = insertedRoot.rows[0].id;
      await client.query(
        `INSERT INTO spree_taxon_translations (spree_taxon_id, locale, name, permalink, pretty_name, created_at, updated_at)
         VALUES ($1, 'en', 'Categories', 'categories', 'Categories', NOW(), NOW());`,
        [rootTaxonId]
      );
    } else {
      rootTaxonId = rootRes.rows[0].id;
    }
    console.log('Root Taxon ID:', rootTaxonId);

    // 3. Child Taxons
    const taxonMap = {};
    const categories = [
      { name: 'Oxfords', slug: 'oxfords', lft: 2, rgt: 3 },
      { name: 'Derbies', slug: 'derbies', lft: 4, rgt: 5 },
      { name: 'Loafers', slug: 'loafers', lft: 6, rgt: 7 },
      { name: 'Chelsea Boots', slug: 'chelsea-boots', lft: 8, rgt: 9 },
      { name: 'Monk Straps', slug: 'monk-straps', lft: 10, rgt: 11 }
    ];

    for (const cat of categories) {
      const permalink = `categories/${cat.slug}`;
      const prettyName = `Categories -> ${cat.name}`;
      let cRes = await client.query("SELECT id FROM spree_taxons WHERE permalink = $1 AND store_id = 1;", [permalink]);
      let catId;
      if (cRes.rows.length === 0) {
        const ins = await client.query(
          `INSERT INTO spree_taxons (name, taxonomy_id, parent_id, permalink, pretty_name, position, lft, rgt, depth, store_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 1, $6, $7, 1, 1, NOW(), NOW()) RETURNING id;`,
          [cat.name, taxonomyId, rootTaxonId, permalink, prettyName, cat.lft, cat.rgt]
        );
        catId = ins.rows[0].id;
        await client.query(
          `INSERT INTO spree_taxon_translations (spree_taxon_id, locale, name, permalink, pretty_name, created_at, updated_at)
           VALUES ($1, 'en', $2, $3, $4, NOW(), NOW());`,
          [catId, cat.name, permalink, prettyName]
        );
      } else {
        catId = cRes.rows[0].id;
      }
      taxonMap[cat.name] = catId;
    }
    console.log('Taxon Map:', taxonMap);

    // 4. Products, Variants, Prices, Stock, Stores, Taxons, Publications
    for (const item of CATALOG) {
      let pRes = await client.query("SELECT id FROM spree_products WHERE slug = $1 AND store_id = 1;", [item.slug]);
      let productId;
      if (pRes.rows.length === 0) {
        const insProd = await client.query(
          `INSERT INTO spree_products (
            name, description, slug, available_on, make_active_at, status,
            shipping_category_id, store_id, promotionable, variant_count,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, NOW() - interval '1 day', NOW() - interval '1 day', 'active',
            1, 1, true, 1,
            NOW(), NOW()
          ) RETURNING id;`,
          [item.name, item.description, item.slug]
        );
        productId = insProd.rows[0].id;

        // Mobility translations
        await client.query(
          `INSERT INTO spree_product_translations (spree_product_id, locale, name, description, slug, created_at, updated_at)
           VALUES ($1, 'en', $2, $3, $4, NOW(), NOW());`,
          [productId, item.name, item.description, item.slug]
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

        // Price in USD
        await client.query(
          `INSERT INTO spree_prices (variant_id, amount, currency, created_at, updated_at)
           VALUES ($1, $2, 'USD', NOW(), NOW());`,
          [variantId, item.price]
        );

        // Stock Item at Location 1
        await client.query(
          `INSERT INTO spree_stock_items (stock_location_id, variant_id, count_on_hand, backorderable, created_at, updated_at)
           VALUES (1, $1, 50, true, NOW(), NOW());`,
          [variantId]
        );

        // Associate with Category Taxon and Root Taxon
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

        // Associate with Store
        await client.query(
          `INSERT INTO spree_products_stores (product_id, store_id, created_at, updated_at)
           VALUES ($1, 1, NOW(), NOW());`,
          [productId]
        );

        // Publish to Channels 1 (Online) and 2 (Wholesale)
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

        console.log(`Seeded: ${item.name} (ID: ${productId}, SKU: ${item.sku})`);
      } else {
        productId = pRes.rows[0].id;
        console.log(`Already exists: ${item.name} (ID: ${productId})`);
      }
    }

    await client.query('COMMIT');
    console.log('\nAll 5 artisanal footwear catalog items successfully seeded into Supabase Spree schema!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
