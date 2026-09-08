import crypto from "node:crypto";
import pg from "pg";
import { CATEGORIES, PRODUCTS } from "./mock-spree-server.mjs";

const { Client } = pg;
const databaseUrl =
  process.env.SUPABASE_DATABASE_URL ||
  "postgresql://postgres.nmddtxibpsbtswxnienm:Punit1803.com@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function initialize() {
  console.log("=======================================================");
  console.log(" Initializing Mirza Footwear Schema on Supabase Mumbai");
  console.log("=======================================================\n");

  await client.connect();
  console.log("Connected to PostgreSQL successfully.\n");

  // 1. Create Core Tables
  console.log("Creating tables...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS spree_taxonomies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_taxons (
      id SERIAL PRIMARY KEY,
      taxonomy_id INTEGER REFERENCES spree_taxonomies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      permalink VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      description_html TEXT,
      price NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      purchasable BOOLEAN DEFAULT TRUE,
      in_stock BOOLEAN DEFAULT TRUE,
      total_on_hand INTEGER DEFAULT 0,
      thumbnail_url TEXT,
      data_json JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_variants (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES spree_products(id) ON DELETE CASCADE,
      sku VARCHAR(100) UNIQUE NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      size_option VARCHAR(20),
      is_master BOOLEAN DEFAULT FALSE,
      purchasable BOOLEAN DEFAULT TRUE,
      in_stock BOOLEAN DEFAULT TRUE,
      data_json JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_stock_items (
      id SERIAL PRIMARY KEY,
      variant_id INTEGER REFERENCES spree_variants(id) ON DELETE CASCADE,
      count_on_hand INTEGER NOT NULL DEFAULT 10,
      backorderable BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_orders (
      id SERIAL PRIMARY KEY,
      number VARCHAR(50) UNIQUE NOT NULL,
      token VARCHAR(100) NOT NULL,
      state VARCHAR(50) DEFAULT 'cart',
      email VARCHAR(255),
      total NUMERIC(10, 2) DEFAULT 0.00,
      currency VARCHAR(10) DEFAULT 'USD',
      order_data JSONB NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_line_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES spree_orders(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES spree_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      price NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(50),
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS spree_addresses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES spree_users(id) ON DELETE CASCADE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      address1 TEXT NOT NULL,
      address2 TEXT,
      city VARCHAR(100) NOT NULL,
      state_name VARCHAR(100) NOT NULL,
      country_iso VARCHAR(10) NOT NULL DEFAULT 'in',
      zipcode VARCHAR(20) NOT NULL,
      phone VARCHAR(50),
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log("Tables created successfully.\n");

  // 2. Seed Taxonomies & Taxons
  console.log("Seeding taxonomies and taxons...");
  const taxRes = await client.query(
    `INSERT INTO spree_taxonomies (name) VALUES ('Categories')
     RETURNING id;`
  );
  const taxId = taxRes.rows[0]?.id || 1;

  for (const cat of CATEGORIES) {
    await client.query(
      `INSERT INTO spree_taxons (taxonomy_id, name, permalink, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (permalink) DO UPDATE SET name = $2, description = $4;`,
      [taxId, cat.name, cat.permalink, cat.description]
    );
  }
  console.log("Taxonomies and categories seeded.\n");

  // 3. Seed Products, Variants, and Stock
  console.log("Seeding products, variants, and stock...");
  for (const p of PRODUCTS) {
    const priceAmount = parseFloat(p.price?.amount || "185.00");
    const currency = p.price?.currency || "USD";

    const prodRes = await client.query(
      `INSERT INTO spree_products (name, slug, description, description_html, price, currency, purchasable, in_stock, total_on_hand, thumbnail_url, data_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (slug) DO UPDATE SET
         name = $1, description = $3, description_html = $4, price = $5,
         purchasable = $7, in_stock = $8, total_on_hand = $9, thumbnail_url = $10, data_json = $11
       RETURNING id;`,
      [
        p.name,
        p.slug,
        p.description,
        p.description_html,
        priceAmount,
        currency,
        p.purchasable,
        p.in_stock,
        p.total_on_hand || 50,
        p.thumbnail_url,
        JSON.stringify(p),
      ]
    );
    const productId = prodRes.rows[0].id;

    // Seed master/default variant
    if (p.default_variant) {
      const def = p.default_variant;
      const defPrice = parseFloat(def.price?.amount || priceAmount);
      const varRes = await client.query(
        `INSERT INTO spree_variants (product_id, sku, price, currency, is_master, purchasable, in_stock, data_json)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)
         ON CONFLICT (sku) DO UPDATE SET price = $3, purchasable = $5, in_stock = $6, data_json = $7
         RETURNING id;`,
        [productId, def.sku, defPrice, currency, def.purchasable, def.in_stock, JSON.stringify(def)]
      );
      const varId = varRes.rows[0].id;

      await client.query(
        `INSERT INTO spree_stock_items (variant_id, count_on_hand)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING;`,
        [varId, def.total_on_hand || 20]
      );
    }

    // Seed size variants
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        const vPrice = parseFloat(v.price?.amount || priceAmount);
        const sizeOption = v.option_values?.[0]?.presentation || "Standard";

        const varRes = await client.query(
          `INSERT INTO spree_variants (product_id, sku, price, currency, size_option, is_master, purchasable, in_stock, data_json)
           VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7, $8)
           ON CONFLICT (sku) DO UPDATE SET price = $3, size_option = $5, purchasable = $6, in_stock = $7, data_json = $8
           RETURNING id;`,
          [productId, v.sku, vPrice, currency, sizeOption, v.purchasable, v.in_stock, JSON.stringify(v)]
        );
        const varId = varRes.rows[0].id;

        await client.query(
          `INSERT INTO spree_stock_items (variant_id, count_on_hand)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [varId, v.total_on_hand || 15]
        );
      }
    }
  }
  console.log("Products, variants, and stock seeded successfully!\n");

  // 4. Seed Default Admin & Customer Accounts
  console.log("Seeding default Administrator & Customer accounts...");
  const adminPassHash = hashPassword("MirzaAdmin2026!");
  const patronPassHash = hashPassword("Customer2026!");

  const adminRes = await client.query(
    `INSERT INTO spree_users (email, password_hash, first_name, last_name, phone, role)
     VALUES ('admin@mirzafootwear.com', $1, 'Mirza', 'Administrator', '+91 98765 00001', 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'admin'
     RETURNING id;`,
    [adminPassHash]
  );

  const patronRes = await client.query(
    `INSERT INTO spree_users (email, password_hash, first_name, last_name, phone, role)
     VALUES ('patron@mirzafootwear.com', $1, 'Mirza', 'Patron', '+91 98765 43210', 'customer')
     ON CONFLICT (email) DO UPDATE SET password_hash = $1
     RETURNING id;`,
    [patronPassHash]
  );

  const patronId = patronRes.rows[0]?.id;
  if (patronId) {
    await client.query(
      `INSERT INTO spree_addresses (user_id, first_name, last_name, address1, city, state_name, country_iso, zipcode, phone, is_default)
       VALUES ($1, 'Mirza', 'Patron', '42 Heritage Colaba Causeway', 'Mumbai', 'Maharashtra', 'in', '400001', '+91 98765 43210', TRUE)
       ON CONFLICT DO NOTHING;`,
      [patronId]
    );
  }
  console.log("Users and address seeded successfully!\n");

  // Verify counts in Supabase
  const countProd = await client.query("SELECT COUNT(*) FROM spree_products;");
  const countVar = await client.query("SELECT COUNT(*) FROM spree_variants;");
  const countStock = await client.query("SELECT SUM(count_on_hand) as total_stock FROM spree_stock_items;");
  const countUsers = await client.query("SELECT COUNT(*) FROM spree_users;");

  console.log("=======================================================");
  console.log(" Supabase Mumbai Database Summary");
  console.log("=======================================================");
  console.log(`Total Products: ${countProd.rows[0].count}`);
  console.log(`Total Variants: ${countVar.rows[0].count}`);
  console.log(`Total In-Stock Units: ${countStock.rows[0].total_stock}`);
  console.log(`Total Registered Users: ${countUsers.rows[0].count}`);
  console.log("=======================================================\n");

  await client.end();
}

initialize().catch((err) => {
  console.error("Initialization error:", err);
  process.exit(1);
});
