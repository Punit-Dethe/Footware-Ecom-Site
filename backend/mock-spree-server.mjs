/**
 * Mock Spree Commerce Store API v3 Server for Mirza Footwear
 * Fully compliant in-memory stateful server for:
 * - Handcrafted Traditional Indian Footwear
 * - Executive Formal Office Leather Footwear
 * - Full Cart & Checkout Lifecycle (Add to cart, address, shipping, demo payment, order confirmation)
 * - Customer Auth & Account Management
 */

import http from 'node:http';
import url from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const JWT_SECRET = process.env.SPREE_JWT_SECRET || 'mirza_luxury_footwear_secret_key_2026';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!password || !stored || !stored.includes(':')) return false;
  try {
    const [salt, key] = stored.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derived = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derived);
  } catch {
    return false;
  }
}

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (payload.exp || 86400 * 30);
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAuthUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/_spree_jwt=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  return verifyJwt(token);
}

const USERS = new Map();
USERS.set('admin@mirzafootwear.com', {
  id: '1',
  email: 'admin@mirzafootwear.com',
  password_hash: hashPassword('MirzaAdmin2026!'),
  first_name: 'Mirza',
  last_name: 'Administrator',
  phone: '+91 98765 00001',
  role: 'admin',
  created_at: new Date().toISOString()
});
USERS.set('patron@mirzafootwear.com', {
  id: '2',
  email: 'patron@mirzafootwear.com',
  password_hash: hashPassword('Customer2026!'),
  first_name: 'Mirza',
  last_name: 'Patron',
  phone: '+91 98765 43210',
  role: 'customer',
  created_at: new Date().toISOString()
});

// Automatically load backend .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    const envPath = path.resolve(process.cwd(), '.env');
    const backendEnvPath = path.resolve(process.cwd(), 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
      process.loadEnvFile(backendEnvPath);
    } else if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }
} catch {
  // Ignore if env file does not exist
}

const PORT = parseInt(process.env.SPREE_PORT || '4000', 10);
const SUPABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

let dbPool = null;
if (SUPABASE_URL) {
  try {
    dbPool = new pg.Pool({
      connectionString: SUPABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
    dbPool.on('error', (err) => {
      console.warn('[Supabase DB Pool Error]', err.message);
    });
  } catch (err) {
    console.warn('[Supabase DB Init Error]', err.message);
  }
}

async function syncCatalogFromDatabase() {
  if (!dbPool) return;
  try {
    const res = await dbPool.query('SELECT data_json, in_stock, total_on_hand FROM spree_products ORDER BY id ASC');
    if (res.rows.length > 0) {
      PRODUCTS.length = 0;
      for (const row of res.rows) {
        const prod = row.data_json;
        prod.in_stock = row.in_stock;
        prod.total_on_hand = row.total_on_hand;
        PRODUCTS.push(prod);
      }
      console.log(`[Supabase DB] Synced ${PRODUCTS.length} live products from Supabase Mumbai.`);
    }
  } catch (err) {
    console.warn('[Supabase DB] Sync fallback to local memory:', err.message);
  }
}

const MARKETS = [
  {
    id: 'market_us',
    code: 'us',
    name: 'United States',
    default: true,
    default_country: { iso: 'us', name: 'United States' },
    default_locale: 'en',
    supported_locales: ['en'],
    currencies: ['USD'],
    countries: [{ iso: 'us', name: 'United States' }],
  },
  {
    id: 'market_in',
    code: 'in',
    name: 'India',
    default: false,
    default_country: { iso: 'in', name: 'India' },
    default_locale: 'en',
    supported_locales: ['en'],
    currencies: ['INR'],
    countries: [{ iso: 'in', name: 'India' }],
  },
];

const COUNTRIES = [
  {
    iso: 'us',
    name: 'United States',
    default_locale: 'en',
    currency: 'USD',
    states: [
      { id: 'st_ny', abbr: 'NY', name: 'New York' },
      { id: 'st_ca', abbr: 'CA', name: 'California' },
      { id: 'st_tx', abbr: 'TX', name: 'Texas' },
    ],
  },
  {
    iso: 'in',
    name: 'India',
    default_locale: 'en',
    currency: 'INR',
    states: [
      { id: 'st_mh', abbr: 'MH', name: 'Maharashtra' },
      { id: 'st_dl', abbr: 'DL', name: 'Delhi' },
      { id: 'st_ka', abbr: 'KA', name: 'Karnataka' },
      { id: 'st_up', abbr: 'UP', name: 'Uttar Pradesh' },
    ],
  },
];

const CATEGORIES = [
  {
    id: 'cat_formal',
    name: 'Formal & Office Shoes',
    permalink: 'formal-office',
    description: 'Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies for boardroom distinction.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_traditional',
    name: 'Traditional Indian Footwear',
    permalink: 'traditional-indian',
    description: 'Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_loafers',
    name: 'Loafers & Slip-Ons',
    permalink: 'loafers-slip-ons',
    description: 'Saddle Penny Loafers and Venetian Tassel slip-ons handcrafted from vegetable-tanned calfskin.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_boots',
    name: 'Leather Boots',
    permalink: 'boots-leather',
    description: 'Executive Chelsea and Chukka boots with hand-burnished patina and cork-bed comfort.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
];

const PRODUCTS = [
  // 1. Formal Oxford
  {
    id: 'prod_mirza_imperial_oxford',
    name: 'Mirza Imperial Wholecut Oxford',
    slug: 'mirza-imperial-wholecut-oxford',
    description: 'Crafted from a single flawless cut of Italian full-grain calfskin with hand-burnished mahogany patina. Features Goodyear welted construction, bevelled leather waist, and cork-filled footbed.',
    description_html: '<p>Crafted from a single flawless cut of Italian full-grain calfskin with hand-burnished mahogany patina. Features Goodyear welted construction, bevelled leather waist, and cork-filled footbed.</p><ul><li>Goodyear welted single-piece upper</li><li>Bevelled waist & oak-bark leather sole</li><li>Full leather lining & cork cushioned insole</li><li>Handcrafted in limited artisan batches</li></ul>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_ox_1',
      url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Imperial Wholecut Oxford in Mahogany Tan',
    },
    media: [
      { id: 'med_ox_1', url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Imperial Wholecut Oxford' },
      { id: 'med_ox_2', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85', alt: 'Oxford leather profile' },
    ],
    price: { display_amount: '$185.00', amount_in_cents: 18500, compare_at_amount_in_cents: 22000, display_compare_at_amount: '$220.00' },
    original_price: { display_amount: '$220.00', amount_in_cents: 22000 },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_ox_8',
    variants: [
      { id: 'var_ox_7', is_master: false, sku: 'MRZ-OX-BRN-07', in_stock: true, price: { display_amount: '$185.00', amount_in_cents: 18500 }, options_text: 'Size: UK/India 7, Color: Mahogany Tan', option_values: [{ id: 'opt_sz_7', option_type_name: 'size', presentation: 'UK/India 7' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' }] },
      { id: 'var_ox_8', is_master: true, sku: 'MRZ-OX-BRN-08', in_stock: true, price: { display_amount: '$185.00', amount_in_cents: 18500 }, options_text: 'Size: UK/India 8, Color: Mahogany Tan', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' }] },
      { id: 'var_ox_9', is_master: false, sku: 'MRZ-OX-BRN-09', in_stock: true, price: { display_amount: '$185.00', amount_in_cents: 18500 }, options_text: 'Size: UK/India 9, Color: Mahogany Tan', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' }] },
      { id: 'var_ox_10', is_master: false, sku: 'MRZ-OX-BRN-10', in_stock: true, price: { display_amount: '$185.00', amount_in_cents: 18500 }, options_text: 'Size: UK/India 10, Color: Mahogany Tan', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 2. Formal Brogue
  {
    id: 'prod_mirza_royal_brogue',
    name: 'Mirza Royal Wingtip Brogue',
    slug: 'mirza-royal-wingtip-brogue',
    description: 'Classic full-wingtip silhouette with hand-punched medallion broguing. Built on traditional English lasts with oak-bark tanned leather outsoles and channelled stitching.',
    description_html: '<p>Classic full-wingtip silhouette with hand-punched medallion broguing. Built on traditional English lasts with oak-bark tanned leather outsoles and channelled stitching.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_br_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Royal Wingtip Brogue' },
    media: [{ id: 'med_br_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Royal Wingtip Brogue' }],
    price: { display_amount: '$170.00', amount_in_cents: 17000 },
    original_price: { display_amount: '$170.00', amount_in_cents: 17000 },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_br_9',
    variants: [
      { id: 'var_br_8', is_master: false, sku: 'MRZ-BRG-COG-08', in_stock: true, price: { display_amount: '$170.00', amount_in_cents: 17000 }, options_text: 'Size: UK/India 8, Color: Antique Cognac', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Antique Cognac' }] },
      { id: 'var_br_9', is_master: true, sku: 'MRZ-BRG-COG-09', in_stock: true, price: { display_amount: '$170.00', amount_in_cents: 17000 }, options_text: 'Size: UK/India 9, Color: Antique Cognac', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Antique Cognac' }] },
      { id: 'var_br_10', is_master: false, sku: 'MRZ-BRG-COG-10', in_stock: true, price: { display_amount: '$170.00', amount_in_cents: 17000 }, options_text: 'Size: UK/India 10, Color: Antique Cognac', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Antique Cognac' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 3. Double Monk Strap
  {
    id: 'prod_mirza_double_monk',
    name: 'Mirza Heritage Double Monk Strap',
    slug: 'mirza-heritage-double-monk-strap',
    description: 'Architectural chisel toe with dual solid brass equestrian buckles. Hand-glazed French calf leather in a deep oxblood patina, lined with glove-soft lambskin.',
    description_html: '<p>Architectural chisel toe with dual solid brass equestrian buckles. Hand-glazed French calf leather in a deep oxblood patina, lined with glove-soft lambskin.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_mk_1', url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Heritage Double Monk Strap' },
    media: [{ id: 'med_mk_1', url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Double Monk' }],
    price: { display_amount: '$175.00', amount_in_cents: 17500 },
    original_price: { display_amount: '$175.00', amount_in_cents: 17500 },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_mk_9',
    variants: [
      { id: 'var_mk_8', is_master: false, sku: 'MRZ-MNK-OXB-08', in_stock: true, price: { display_amount: '$175.00', amount_in_cents: 17500 }, options_text: 'Size: UK/India 8, Color: Deep Oxblood', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Deep Oxblood' }] },
      { id: 'var_mk_9', is_master: true, sku: 'MRZ-MNK-OXB-09', in_stock: true, price: { display_amount: '$175.00', amount_in_cents: 17500 }, options_text: 'Size: UK/India 9, Color: Deep Oxblood', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Deep Oxblood' }] },
      { id: 'var_mk_10', is_master: false, sku: 'MRZ-MNK-OXB-10', in_stock: true, price: { display_amount: '$175.00', amount_in_cents: 17500 }, options_text: 'Size: UK/India 10, Color: Deep Oxblood', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Deep Oxblood' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 4. Executive Derby
  {
    id: 'prod_mirza_cap_toe_derby',
    name: 'Mirza Executive Cap-Toe Derby',
    slug: 'mirza-executive-cap-toe-derby',
    description: 'Refined open-laced Derby crafted in midnight black box-calf. Designed for generous instep comfort with structured toe cap and dress rubber city sole.',
    description_html: '<p>Refined open-laced Derby crafted in midnight black box-calf. Designed for generous instep comfort with structured toe cap and dress rubber city sole.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_db_1', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Executive Derby' },
    media: [{ id: 'med_db_1', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Derby' }],
    price: { display_amount: '$165.00', amount_in_cents: 16500 },
    original_price: { display_amount: '$165.00', amount_in_cents: 16500 },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_db_8',
    variants: [
      { id: 'var_db_8', is_master: true, sku: 'MRZ-DRB-BLK-08', in_stock: true, price: { display_amount: '$165.00', amount_in_cents: 16500 }, options_text: 'Size: UK/India 8, Color: Midnight Black', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_blk', option_type_name: 'color', presentation: 'Midnight Black' }] },
      { id: 'var_db_9', is_master: false, sku: 'MRZ-DRB-BLK-09', in_stock: true, price: { display_amount: '$165.00', amount_in_cents: 16500 }, options_text: 'Size: UK/India 9, Color: Midnight Black', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_blk', option_type_name: 'color', presentation: 'Midnight Black' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 5. Traditional Jutti
  {
    id: 'prod_mirza_artisan_jutti',
    name: 'Mirza Royal Embroidered Jutti',
    slug: 'mirza-royal-embroidered-jutti',
    description: 'Traditional handcrafted Indian ceremonial jutti created by master artisans. Pure supple leather with intricate gold-thread dabka & zardozi embroidery, curved toe, and double-padded insole.',
    description_html: '<p>Traditional handcrafted Indian ceremonial jutti created by master artisans. Pure supple leather with intricate gold-thread dabka & zardozi embroidery, curved toe, and double-padded insole for royal occasions.</p><ul><li>Authentic Dabka & Zardozi gold handwork</li><li>Supple camel/cowhide leather base</li><li>Double-padded memory insole for all-day festive comfort</li><li>Traditional non-pinching curled toe profile</li></ul>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_jt_1', url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Royal Embroidered Jutti' },
    media: [{ id: 'med_jt_1', url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Royal Jutti' }],
    price: { display_amount: '$95.00', amount_in_cents: 9500, compare_at_amount_in_cents: 12000, display_compare_at_amount: '$120.00' },
    original_price: { display_amount: '$120.00', amount_in_cents: 12000 },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_jt_8',
    variants: [
      { id: 'var_jt_7', is_master: false, sku: 'MRZ-JUT-GLD-07', in_stock: true, price: { display_amount: '$95.00', amount_in_cents: 9500 }, options_text: 'Size: UK/India 7, Color: Regal Gold', option_values: [{ id: 'opt_sz_7', option_type_name: 'size', presentation: 'UK/India 7' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' }] },
      { id: 'var_jt_8', is_master: true, sku: 'MRZ-JUT-GLD-08', in_stock: true, price: { display_amount: '$95.00', amount_in_cents: 9500 }, options_text: 'Size: UK/India 8, Color: Regal Gold', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' }] },
      { id: 'var_jt_9', is_master: false, sku: 'MRZ-JUT-GLD-09', in_stock: true, price: { display_amount: '$95.00', amount_in_cents: 9500 }, options_text: 'Size: UK/India 9, Color: Regal Gold', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' }] },
      { id: 'var_jt_10', is_master: false, sku: 'MRZ-JUT-GLD-10', in_stock: true, price: { display_amount: '$95.00', amount_in_cents: 9500 }, options_text: 'Size: UK/India 10, Color: Regal Gold', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 6. Velvet Mojari
  {
    id: 'prod_mirza_velvet_mojari',
    name: 'Mirza Ceremonial Velvet Mojari',
    slug: 'mirza-ceremonial-velvet-mojari',
    description: 'Opulent deep emerald and royal velvet wedding mojari with intricate silver and antique tilla threadwork. Custom-curled toe and traditional bridal lining.',
    description_html: '<p>Opulent deep emerald and royal velvet wedding mojari with intricate silver and antique tilla threadwork. Custom-curled toe and traditional bridal lining.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_mj_1', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Velvet Mojari' },
    media: [{ id: 'med_mj_1', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Velvet Mojari' }],
    price: { display_amount: '$110.00', amount_in_cents: 11000 },
    original_price: { display_amount: '$110.00', amount_in_cents: 11000 },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_mj_8',
    variants: [
      { id: 'var_mj_8', is_master: true, sku: 'MRZ-MOJ-EMR-08', in_stock: true, price: { display_amount: '$110.00', amount_in_cents: 11000 }, options_text: 'Size: UK/India 8, Color: Royal Velvet', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Royal Velvet' }] },
      { id: 'var_mj_9', is_master: false, sku: 'MRZ-MOJ-EMR-09', in_stock: true, price: { display_amount: '$110.00', amount_in_cents: 11000 }, options_text: 'Size: UK/India 9, Color: Royal Velvet', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Royal Velvet' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 7. Peshawari Sandal
  {
    id: 'prod_mirza_peshawari_sandal',
    name: 'Mirza Handcrafted Peshawari Sandal',
    slug: 'mirza-handcrafted-peshawari-sandal',
    description: 'Traditional heritage Peshawari silhouette with cross-over premium bridle leather straps, adjustable buckle backstay, and durable dual-stitch Goodyear sole.',
    description_html: '<p>Traditional heritage Peshawari silhouette with cross-over premium bridle leather straps, adjustable buckle backstay, and durable dual-stitch Goodyear sole.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_ps_1', url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Handcrafted Peshawari Sandal' },
    media: [{ id: 'med_ps_1', url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Peshawari Sandal' }],
    price: { display_amount: '$90.00', amount_in_cents: 9000, compare_at_amount_in_cents: 11000, display_compare_at_amount: '$110.00' },
    original_price: { display_amount: '$110.00', amount_in_cents: 11000 },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_ps_8',
    variants: [
      { id: 'var_ps_8', is_master: true, sku: 'MRZ-PSH-TAN-08', in_stock: true, price: { display_amount: '$90.00', amount_in_cents: 9000 }, options_text: 'Size: UK/India 8, Color: Rustic Tan', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Rustic Tan' }] },
      { id: 'var_ps_9', is_master: false, sku: 'MRZ-PSH-TAN-09', in_stock: true, price: { display_amount: '$90.00', amount_in_cents: 9000 }, options_text: 'Size: UK/India 9, Color: Rustic Tan', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Rustic Tan' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 8. Kolhapuri Chappal
  {
    id: 'prod_mirza_kolhapuri_chappal',
    name: 'Mirza Artisan Kolhapuri Chappal',
    slug: 'mirza-artisan-kolhapuri-chappal',
    description: 'Authentic Kolhapuri handcrafted from vegetable-tanned buffalo hide with intricate braided strap and cord work. Dyed in warm natural walnut bark extract.',
    description_html: '<p>Authentic Kolhapuri handcrafted from vegetable-tanned buffalo hide with intricate braided strap and cord work. Dyed in warm natural walnut bark extract.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_kp_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Artisan Kolhapuri Chappal' },
    media: [{ id: 'med_kp_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Kolhapuri Chappal' }],
    price: { display_amount: '$75.00', amount_in_cents: 7500 },
    original_price: { display_amount: '$75.00', amount_in_cents: 7500 },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_kp_8',
    variants: [
      { id: 'var_kp_8', is_master: true, sku: 'MRZ-KLP-BRN-08', in_stock: true, price: { display_amount: '$75.00', amount_in_cents: 7500 }, options_text: 'Size: UK/India 8, Color: Raw Chestnut', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Raw Chestnut' }] },
      { id: 'var_kp_9', is_master: false, sku: 'MRZ-KLP-BRN-09', in_stock: true, price: { display_amount: '$75.00', amount_in_cents: 7500 }, options_text: 'Size: UK/India 9, Color: Raw Chestnut', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Raw Chestnut' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 9. Penny Loafer
  {
    id: 'prod_mirza_penny_loafer',
    name: 'Mirza Classic Saddle Penny Loafer',
    slug: 'mirza-classic-saddle-penny-loafer',
    description: 'Unstructured comfort meets formal office elegance. Hand-sewn moc-toe with traditional diamond cut-out strap in rich espresso pull-up leather.',
    description_html: '<p>Unstructured comfort meets formal office elegance. Hand-sewn moc-toe with traditional diamond cut-out strap in rich espresso pull-up leather.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_lf_1', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Classic Saddle Penny Loafer' },
    media: [{ id: 'med_lf_1', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Penny Loafer' }],
    price: { display_amount: '$155.00', amount_in_cents: 15500 },
    original_price: { display_amount: '$155.00', amount_in_cents: 15500 },
    categories: [CATEGORIES[2]],
    default_variant_id: 'var_lf_9',
    variants: [
      { id: 'var_lf_8', is_master: false, sku: 'MRZ-PNY-ESP-08', in_stock: true, price: { display_amount: '$155.00', amount_in_cents: 15500 }, options_text: 'Size: UK/India 8, Color: Espresso Brown', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_brn', option_type_name: 'color', presentation: 'Espresso Brown' }] },
      { id: 'var_lf_9', is_master: true, sku: 'MRZ-PNY-ESP-09', in_stock: true, price: { display_amount: '$155.00', amount_in_cents: 15500 }, options_text: 'Size: UK/India 9, Color: Espresso Brown', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_brn', option_type_name: 'color', presentation: 'Espresso Brown' }] },
      { id: 'var_lf_10', is_master: false, sku: 'MRZ-PNY-ESP-10', in_stock: true, price: { display_amount: '$155.00', amount_in_cents: 15500 }, options_text: 'Size: UK/India 10, Color: Espresso Brown', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_brn', option_type_name: 'color', presentation: 'Espresso Brown' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 10. Tassel Loafer
  {
    id: 'prod_mirza_tassel_loafer',
    name: 'Mirza Venetian Tassel Loafer',
    slug: 'mirza-venetian-tassel-loafer',
    description: 'Polished cordovan burnish with hand-braided side weave and twin swinging tassels. Perfect for smart office Fridays and evening gatherings.',
    description_html: '<p>Polished cordovan burnish with hand-braided side weave and twin swinging tassels. Perfect for smart office Fridays and evening gatherings.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_tl_1', url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Tassel Loafer' },
    media: [{ id: 'med_tl_1', url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Tassel Loafer' }],
    price: { display_amount: '$160.00', amount_in_cents: 16000 },
    original_price: { display_amount: '$160.00', amount_in_cents: 16000 },
    categories: [CATEGORIES[2]],
    default_variant_id: 'var_tl_9',
    variants: [
      { id: 'var_tl_8', is_master: false, sku: 'MRZ-TSL-CRD-08', in_stock: true, price: { display_amount: '$160.00', amount_in_cents: 16000 }, options_text: 'Size: UK/India 8, Color: Cordovan Burnish', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Cordovan Burnish' }] },
      { id: 'var_tl_9', is_master: true, sku: 'MRZ-TSL-CRD-09', in_stock: true, price: { display_amount: '$160.00', amount_in_cents: 16000 }, options_text: 'Size: UK/India 9, Color: Cordovan Burnish', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Cordovan Burnish' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 11. Chelsea Boot
  {
    id: 'prod_mirza_chelsea_boot',
    name: 'Mirza Executive Chelsea Boot',
    slug: 'mirza-executive-chelsea-boot',
    description: 'Clean whole-cut upper crafted from burnished walnut calfskin. High-elastic side webbing, leather pull-tabs, and sleek low-profile rubber city sole for year-round office wear.',
    description_html: '<p>Clean whole-cut upper crafted from burnished walnut calfskin. High-elastic side webbing, leather pull-tabs, and sleek low-profile rubber city sole for year-round office wear.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_ch_1', url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Executive Chelsea Boot' },
    media: [{ id: 'med_ch_1', url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Chelsea Boot' }],
    price: { display_amount: '$195.00', amount_in_cents: 19500, compare_at_amount_in_cents: 23000, display_compare_at_amount: '$230.00' },
    original_price: { display_amount: '$230.00', amount_in_cents: 23000 },
    categories: [CATEGORIES[3]],
    default_variant_id: 'var_ch_9',
    variants: [
      { id: 'var_ch_8', is_master: false, sku: 'MRZ-CHL-WAL-08', in_stock: true, price: { display_amount: '$195.00', amount_in_cents: 19500 }, options_text: 'Size: UK/India 8, Color: Walnut Calfskin', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Walnut Calfskin' }] },
      { id: 'var_ch_9', is_master: true, sku: 'MRZ-CHL-WAL-09', in_stock: true, price: { display_amount: '$195.00', amount_in_cents: 19500 }, options_text: 'Size: UK/India 9, Color: Walnut Calfskin', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Walnut Calfskin' }] },
      { id: 'var_ch_10', is_master: false, sku: 'MRZ-CHL-WAL-10', in_stock: true, price: { display_amount: '$195.00', amount_in_cents: 19500 }, options_text: 'Size: UK/India 10, Color: Walnut Calfskin', option_values: [{ id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Walnut Calfskin' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },

  // 12. Chukka Boot
  {
    id: 'prod_mirza_hand_burnished_chukka',
    name: 'Mirza Hand-Burnished Chukka Boot',
    slug: 'mirza-hand-burnished-chukka-boot',
    description: 'Ankle-height two-eyelet chukka crafted from supple oiled suede and hand-burnished calfskin. Double-layer leather sole with storm welt protection.',
    description_html: '<p>Ankle-height two-eyelet chukka crafted from supple oiled suede and hand-burnished calfskin. Double-layer leather sole with storm welt protection.</p>',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    primary_media: { id: 'med_ck_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Chukka Boot' },
    media: [{ id: 'med_ck_1', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85', alt: 'Mirza Chukka Boot' }],
    price: { display_amount: '$180.00', amount_in_cents: 18000 },
    original_price: { display_amount: '$180.00', amount_in_cents: 18000 },
    categories: [CATEGORIES[3]],
    default_variant_id: 'var_ck_9',
    variants: [
      { id: 'var_ck_8', is_master: false, sku: 'MRZ-CHK-SUD-08', in_stock: true, price: { display_amount: '$180.00', amount_in_cents: 18000 }, options_text: 'Size: UK/India 8, Color: Antique Cognac', option_values: [{ id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Antique Cognac' }] },
      { id: 'var_ck_9', is_master: true, sku: 'MRZ-CHK-SUD-09', in_stock: true, price: { display_amount: '$180.00', amount_in_cents: 18000 }, options_text: 'Size: UK/India 9, Color: Antique Cognac', option_values: [{ id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' }, { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Antique Cognac' }] },
    ],
    option_types: [{ id: 'ot_size', name: 'size', presentation: 'Size' }, { id: 'ot_color', name: 'color', presentation: 'Color' }],
  },
];

// Normalize products to guarantee complete Spree SDK contracts and real stock management
for (const p of PRODUCTS) {
  let productStock = 0;
  const allVariantIds = p.variants.map(v => v.id);

  for (const v of p.variants) {
    // Inventory and purchasability: assign realistic stock levels (10 to 25 pairs)
    if (v.stock === undefined) {
      const seed = (v.sku || v.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      v.stock = 10 + (seed % 16);
    }
    v.total_on_hand = v.stock;
    v.in_stock = v.stock > 0;
    v.purchasable = v.stock > 0;
    v.track_inventory = true;
    v.backorderable = false;
    productStock += v.stock;

    // Normalizing option values so VariantPicker and Spree SDK can resolve sizes & colors
    if (v.option_values && Array.isArray(v.option_values)) {
      for (const ov of v.option_values) {
        if (!ov.option_type_id) {
          ov.option_type_id = ov.option_type_name === 'size' ? 'ot_size' : 'ot_color';
        }
        if (!ov.name) {
          ov.name = ov.presentation || ov.id;
        }
        if (!ov.presentation) {
          ov.presentation = ov.name;
        }
        ov.option_type_presentation = ov.option_type_name === 'size' ? 'Size' : 'Color';
      }
    }
  }

  p.total_on_hand = productStock;
  p.in_stock = productStock > 0;
  p.purchasable = productStock > 0;

  p.default_variant = p.variants.find(v => v.id === p.default_variant_id) || p.variants[0];
  if (p.default_variant) {
    p.default_variant.in_stock = p.default_variant.stock > 0;
    p.default_variant.purchasable = p.default_variant.stock > 0;
  }

  if (p.primary_media) {
    p.primary_media.variant_ids = p.primary_media.variant_ids || allVariantIds;
    p.primary_media.position = p.primary_media.position || 1;
    p.primary_media.media_type = 'image';
    p.primary_media.original_url = p.primary_media.url;
    p.primary_media.large_url = p.primary_media.url;
    p.primary_media.xlarge_url = p.primary_media.url;
    p.primary_media.small_url = p.thumbnail_url;
    p.primary_media.mini_url = p.thumbnail_url;
  }
  if (p.media) {
    for (let i = 0; i < p.media.length; i++) {
      p.media[i].variant_ids = p.media[i].variant_ids || allVariantIds;
      p.media[i].position = i + 1;
      p.media[i].media_type = 'image';
      p.media[i].original_url = p.media[i].url;
      p.media[i].large_url = p.media[i].url;
      p.media[i].xlarge_url = p.media[i].url;
      p.media[i].small_url = p.thumbnail_url;
      p.media[i].mini_url = p.thumbnail_url;
    }
  }
}

// Helper to find a product and variant by ID
function findVariant(variantId) {
  for (const product of PRODUCTS) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) return { product, variant };
  }
  const first = PRODUCTS[0];
  return { product: first, variant: first.variants[0] };
}

// In-Memory State for Carts and Orders
const CARTS = new Map();
const ORDERS = new Map();

function createInitialCart(cartId) {
  const id = cartId || `cart_${Math.random().toString(36).slice(2, 9)}`;
  const number = `R${Math.floor(100000000 + Math.random() * 900000000)}`;
  const token = `tok_${Math.random().toString(36).slice(2, 12)}`;

  const cart = {
    id,
    number,
    token,
    currency: 'USD',
    item_total: '0.00',
    total: '0.00',
    item_count: 0,
    total_quantity: 0,
    current_step: 'address',
    channel_id: 'channel_default',
    items: [],
    line_items: [],
    shipments: [
      {
        id: 'shp_1',
        number: `H${number.slice(1)}`,
        state: 'pending',
        shipping_method_name: 'Standard White-Glove Delivery (India & Worldwide)',
        delivery_rates: [
          {
            id: 'dr_standard',
            name: 'Standard White-Glove Delivery',
            amount: '0.00',
            display_amount: 'Free',
            selected: true,
          },
          {
            id: 'dr_express',
            name: 'VIP Express Priority Courier',
            amount: '15.00',
            display_amount: '$15.00',
            selected: false,
          },
        ],
      },
    ],
    fulfillments: [
      {
        id: 'ful_1',
        delivery_rates: [
          {
            id: 'dr_standard',
            name: 'Standard White-Glove Delivery',
            amount: '0.00',
            display_amount: 'Free',
            selected: true,
          },
          {
            id: 'dr_express',
            name: 'VIP Express Priority Courier',
            amount: '15.00',
            display_amount: '$15.00',
            selected: false,
          },
        ],
      },
    ],
    payment_methods: [
      {
        id: 'pm_cod',
        name: 'Cash / Pay on Delivery (India & Global)',
        type: 'check',
        kind: 'check',
        payment_type: 'check',
      },
      {
        id: 'pm_card',
        name: 'Credit / Debit Card (Demo Gateway)',
        type: 'check',
        kind: 'check',
        payment_type: 'check',
      },
    ],
    shipping_address: {
      first_name: 'Mirza',
      last_name: 'Footwear Patron',
      address1: '42 Heritage Lane',
      city: 'Mumbai',
      state_name: 'Maharashtra',
      country_iso: 'in',
      zipcode: '400001',
      phone: '+91 98765 43210',
    },
    billing_address: {
      first_name: 'Mirza',
      last_name: 'Footwear Patron',
      address1: '42 Heritage Lane',
      city: 'Mumbai',
      state_name: 'Maharashtra',
      country_iso: 'in',
      zipcode: '400001',
      phone: '+91 98765 43210',
    },
    adjustments: [],
    completed_at: null,
  };

  CARTS.set(id, cart);
  return cart;
}

function recalculateCart(cart) {
  let subtotalCents = 0;
  let count = 0;

  for (const item of cart.items) {
    const itemCents = item.price.amount_in_cents * item.quantity;
    subtotalCents += itemCents;
    count += item.quantity;
    item.display_total = `$${(itemCents / 100).toFixed(2)}`;
  }

  // Shipping cost
  let shippingCents = 0;
  const selectedRate = cart.fulfillments?.[0]?.delivery_rates?.find(r => r.selected);
  if (selectedRate && parseFloat(selectedRate.amount) > 0) {
    shippingCents = Math.round(parseFloat(selectedRate.amount) * 100);
  }

  const totalCents = subtotalCents + shippingCents;

  cart.item_count = count;
  cart.total_quantity = count;
  cart.item_total = (subtotalCents / 100).toFixed(2);
  cart.total = (totalCents / 100).toFixed(2);
  cart.display_total = `$${cart.total}`;
  cart.display_item_total = `$${cart.item_total}`;
  cart.line_items = cart.items;
  return cart;
}

// Default cart for immediate sessions
const defaultCart = createInitialCart('cart_mirza_default');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Spree-Publishable-Key, X-Spree-Channel, X-Spree-Currency, X-Spree-Country, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let bodyData = '';
  req.on('data', chunk => {
    bodyData += chunk;
  });

  req.on('end', () => {
    let body = {};
    if (bodyData) {
      try {
        body = JSON.parse(bodyData);
      } catch {
        // Raw text or non-json body
      }
    }

    handleRequest(req, res, pathname, parsedUrl.query, body);
  });
});

async function handleRequest(req, res, pathname, query, body) {
  // 1. Health check
  if (pathname === '/up') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // 2. Channel & Markets
  if (pathname === '/api/v3/store/markets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: MARKETS, meta: { count: MARKETS.length } }));
    return;
  }

  if (pathname === '/api/v3/store/markets/resolve') {
    const countryIso = (query.country || 'us').toString().toLowerCase();
    const market = MARKETS.find(m => m.code.toLowerCase() === countryIso || m.default_country?.iso === countryIso) || MARKETS[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(market));
    return;
  }

  if (pathname.match(/^\/api\/v3\/store\/markets\/[^/]+\/countries$/)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: COUNTRIES, meta: { count: COUNTRIES.length } }));
    return;
  }

  if (pathname === '/api/v3/store/channel') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'channel_default',
      code: 'default',
      name: 'Mirza Footwear Default Channel',
      active: true,
      default: true,
      storefront_access: 'public',
      guest_checkout: true,
      guest_checkout_allowed: true,
    }));
    return;
  }

  // 3. Countries
  if (pathname === '/api/v3/store/countries') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: COUNTRIES, meta: { count: COUNTRIES.length } }));
    return;
  }

  if (pathname.startsWith('/api/v3/store/countries/')) {
    const iso = pathname.split('/').pop().toLowerCase();
    const country = COUNTRIES.find(c => c.iso === iso) || COUNTRIES[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(country));
    return;
  }

  // 4. Categories
  if (pathname === '/api/v3/store/categories') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: CATEGORIES, meta: { count: CATEGORIES.length, total_count: CATEGORIES.length } }));
    return;
  }

  if (pathname.startsWith('/api/v3/store/categories/')) {
    const slug = pathname.split('/').pop();
    const category = CATEGORIES.find(c => c.permalink === slug || c.id === slug) || CATEGORIES[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(category));
    return;
  }

  // 5. Product Filters Contract (Exact Spree SDK shape to eliminate UI TypeError)
  if (pathname === '/api/v3/store/products/filters') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      filters: [
        {
          id: 'price',
          type: 'price_range',
          min: 65,
          max: 250,
          currency: 'USD',
        },
        {
          id: 'availability',
          type: 'availability',
          options: [
            { id: 'in_stock', label: 'In Stock', count: PRODUCTS.length },
            { id: 'out_of_stock', label: 'Out of Stock', count: 0 },
          ],
        },
        {
          id: 'size',
          type: 'option',
          label: 'Size',
          kind: 'size',
          options: [
            { id: 'opt_sz_7', label: 'UK/India 7', count: 6 },
            { id: 'opt_sz_8', label: 'UK/India 8', count: PRODUCTS.length },
            { id: 'opt_sz_9', label: 'UK/India 9', count: PRODUCTS.length },
            { id: 'opt_sz_10', label: 'UK/India 10', count: 8 },
          ],
        },
        {
          id: 'color',
          type: 'option',
          label: 'Color',
          kind: 'color',
          options: [
            { id: 'opt_col_tan', label: 'Mahogany Tan', count: 6 },
            { id: 'opt_col_gld', label: 'Regal Gold', count: 4 },
            { id: 'opt_col_oxb', label: 'Deep Oxblood', count: 3 },
            { id: 'opt_col_blk', label: 'Midnight Black', count: 4 },
          ],
        },
      ],
      sort_options: [
        { id: 'default' },
        { id: 'price_asc' },
        { id: 'price_desc' },
        { id: 'newest' },
      ],
      default_sort: 'default',
      total_count: PRODUCTS.length,
    }));
    return;
  }

  // 6. Products Listing & Category Filtering
  if (pathname === '/api/v3/store/products') {
    let filtered = [...PRODUCTS];

    // Filter by category_id or permalink
    const categoryId = query.category_id || query.category_slug;
    if (categoryId) {
      filtered = filtered.filter(p =>
        p.categories.some(c => c.id === categoryId || c.permalink === categoryId)
      );
    }

    // Filter by search query q
    const searchQuery = (query.q || '').toString().toLowerCase();
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery)
      );
    }

    // Sort
    const sort = query.sort || '';
    if (sort === 'price_asc') {
      filtered.sort((a, b) => a.price.amount_in_cents - b.price.amount_in_cents);
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => b.price.amount_in_cents - a.price.amount_in_cents);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: filtered,
      meta: {
        count: filtered.length,
        total_count: filtered.length,
        pages: 1,
        page: 1,
      },
    }));
    return;
  }

  // 7. Product Detail
  if (pathname.startsWith('/api/v3/store/products/')) {
    const slugOrId = pathname.split('/').pop();
    const product = PRODUCTS.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Product not found', code: 'not_found' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(product));
    return;
  }

  // 8. Carts API Lifecycle
  if (pathname === '/api/v3/store/carts' || pathname === '/api/v3/store/cart') {
    if (req.method === 'POST') {
      const newCart = createInitialCart();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newCart));
      return;
    }

    // GET carts list
    const current = defaultCart;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [current], meta: { count: 1 } }));
    return;
  }

  // Cart Line Items Create: POST /api/v3/store/carts/:id/items
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/items$/)) {
    const cartId = pathname.split('/')[5];
    let cart = CARTS.get(cartId) || defaultCart;

    const variantId = body.variant_id;
    const quantity = parseInt(body.quantity || '1', 10);
    const { product, variant } = findVariant(variantId);

    const existingIndex = cart.items.findIndex(item => item.variant_id === variantId);
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      const lineItemId = `li_${Math.random().toString(36).slice(2, 9)}`;
      cart.items.push({
        id: lineItemId,
        name: product.name,
        slug: product.slug,
        variant_id: variant.id,
        sku: variant.sku,
        options_text: variant.options_text,
        quantity,
        price: variant.price,
        display_price: variant.price.display_amount,
        thumbnail_url: product.thumbnail_url,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          thumbnail_url: product.thumbnail_url,
        },
      });
    }

    cart = recalculateCart(cart);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cart));
    return;
  }

  // Cart Line Item Update/Delete: PATCH/DELETE /api/v3/store/carts/:id/items/:itemId
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/items\/[^/]+$/)) {
    const parts = pathname.split('/');
    const cartId = parts[5];
    const itemId = parts[7];
    let cart = CARTS.get(cartId) || defaultCart;

    if (req.method === 'DELETE') {
      cart.items = cart.items.filter(item => item.id !== itemId);
      cart = recalculateCart(cart);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cart));
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const quantity = parseInt(body.quantity || '1', 10);
      const item = cart.items.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
      }
      cart = recalculateCart(cart);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cart));
      return;
    }
  }

  // Cart Fulfillments Update: PATCH /api/v3/store/carts/:id/fulfillments/:fid
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/fulfillments\/[^/]+$/)) {
    const parts = pathname.split('/');
    const cartId = parts[5];
    let cart = CARTS.get(cartId) || defaultCart;

    const rateId = body.delivery_rate_id || body.selected_delivery_rate_id;
    if (cart.fulfillments?.[0]?.delivery_rates) {
      for (const rate of cart.fulfillments[0].delivery_rates) {
        rate.selected = rate.id === rateId;
      }
    }
    cart.current_step = 'payment';
    cart = recalculateCart(cart);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cart));
    return;
  }

  // Cart Payments: POST /api/v3/store/carts/:id/payments or payment_sessions
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/(payments|payment_sessions)/)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'pmt_mirza_demo',
      amount: defaultCart.total,
      state: 'completed',
      payment_method_name: 'Cash / Pay on Delivery (India & Global)',
    }));
    return;
  }

  // Cart Complete: POST /api/v3/store/carts/:id/complete
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/complete$/)) {
    const cartId = pathname.split('/')[5];
    const cart = CARTS.get(cartId) || defaultCart;

    // Deduct stock for all purchased line items
    for (const item of (cart.items || [])) {
      const { product, variant } = findVariant(item.variant_id);
      if (variant && variant.stock != null) {
        variant.stock = Math.max(0, variant.stock - (item.quantity || 1));
        variant.total_on_hand = variant.stock;
        variant.in_stock = variant.stock > 0;
        variant.purchasable = variant.stock > 0;
        if (product) {
          product.total_on_hand = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
          product.in_stock = product.total_on_hand > 0;
          product.purchasable = product.in_stock;
        }
      }
    }

    cart.completed_at = new Date().toISOString();
    cart.current_step = 'complete';
    cart.state = 'complete';
    cart.payment_state = 'paid';
    cart.shipment_state = 'ready';

    ORDERS.set(cart.id, { ...cart });
    ORDERS.set(cart.number, { ...cart });

    if (dbPool) {
      dbPool.query(
        `INSERT INTO spree_orders (number, token, state, email, total, currency, order_data, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (number) DO UPDATE SET state = $3, completed_at = NOW()`,
        [
          cart.number,
          cart.token || 'tok_' + cart.id,
          cart.state,
          cart.email || 'customer@mirzafootwear.com',
          parseFloat(cart.total || '0'),
          cart.currency || 'USD',
          JSON.stringify(cart),
        ]
      ).then(() => {
        console.log(`[Supabase DB] Order ${cart.number} saved to Supabase Mumbai.`);
      }).catch((err) => {
        console.warn('[Supabase DB] Failed saving order to database:', err.message);
      });

      for (const item of (cart.items || [])) {
        const qty = item.quantity || 1;
        dbPool.query(
          `UPDATE spree_stock_items si
           SET count_on_hand = GREATEST(0, count_on_hand - $1)
           FROM spree_variants v
           WHERE si.variant_id = v.id AND v.sku = $2`,
          [qty, item.sku]
        ).catch(() => {});
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cart));
    return;
  }

  // Single Cart Associate: PATCH /api/v3/store/carts/:id/associate
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+\/associate$/)) {
    const cartId = pathname.split('/')[5];
    const cart = CARTS.get(cartId) || defaultCart;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cart));
    return;
  }

  // Single Cart Get/Update: GET/PATCH /api/v3/store/carts/:id
  if (pathname.match(/^\/api\/v3\/store\/carts\/[^/]+$/)) {
    const cartId = pathname.split('/').pop();
    let cart = CARTS.get(cartId) || defaultCart;

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (body.shipping_address) {
        cart.shipping_address = { ...cart.shipping_address, ...body.shipping_address };
        cart.current_step = 'delivery';
      }
      if (body.billing_address) {
        cart.billing_address = { ...cart.billing_address, ...body.billing_address };
      }
      cart = recalculateCart(cart);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cart));
    return;
  }

  // 9. Orders API (Post-Purchase & History)
  if (pathname.startsWith('/api/v3/store/orders/')) {
    const idOrNumber = pathname.split('/').pop();
    const order = ORDERS.get(idOrNumber) || defaultCart;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(order));
    return;
  }

  // 10. Customer Account & Authentication (Database-Backed with Supabase)
  if (pathname === '/api/v3/store/auth/login' && req.method === 'POST') {
    const userEmail = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    let user = null;
    if (dbPool) {
      try {
        const dbRes = await dbPool.query(
          'SELECT id, email, password_hash, first_name, last_name, phone, role FROM spree_users WHERE LOWER(email) = LOWER($1)',
          [userEmail]
        );
        if (dbRes.rows.length > 0) user = dbRes.rows[0];
      } catch (e) {
        console.warn('[Login DB Error]', e.message);
      }
    }
    if (!user) user = USERS.get(userEmail);

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Invalid email or password' } }));
      return;
    }

    const token = createJwt({
      id: String(user.id),
      email: user.email,
      role: user.role || 'customer',
      first_name: user.first_name,
      last_name: user.last_name,
    });
    const refreshToken = createJwt({ id: String(user.id), type: 'refresh' });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      token,
      refresh_token: refreshToken,
      user: {
        id: String(user.id),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'customer',
      },
    }));
    return;
  }

  if (pathname === '/api/v3/store/auth/refresh' && req.method === 'POST') {
    const authUser = verifyJwt(body.refresh_token);
    if (!authUser) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Invalid refresh token' } }));
      return;
    }
    const token = createJwt({ id: String(authUser.id), email: authUser.email, role: authUser.role });
    const refreshToken = createJwt({ id: String(authUser.id), type: 'refresh' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token, refresh_token: refreshToken }));
    return;
  }

  if (pathname === '/api/v3/store/auth/logout') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname === '/api/v3/store/customers' && req.method === 'POST') {
    const userEmail = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const firstName = (body.first_name || '').trim();
    const lastName = (body.last_name || '').trim();
    const phone = (body.phone || '').trim();

    if (!userEmail || !password) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'unprocessable_entity', message: 'Email and password are required' } }));
      return;
    }

    let existing = null;
    if (dbPool) {
      try {
        const dbCheck = await dbPool.query('SELECT id FROM spree_users WHERE LOWER(email) = LOWER($1)', [userEmail]);
        if (dbCheck.rows.length > 0) existing = dbCheck.rows[0];
      } catch (e) {
        console.warn('[Register DB Check Error]', e.message);
      }
    }
    if (!existing) existing = USERS.get(userEmail);

    if (existing) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'unprocessable_entity', message: 'Email has already been taken' } }));
      return;
    }

    const passHash = hashPassword(password);
    let newUser = null;
    if (dbPool) {
      try {
        const insertRes = await dbPool.query(
          `INSERT INTO spree_users (email, password_hash, first_name, last_name, phone, role)
           VALUES ($1, $2, $3, $4, $5, 'customer')
           RETURNING id, email, first_name, last_name, role`,
          [userEmail, passHash, firstName, lastName, phone]
        );
        newUser = insertRes.rows[0];
      } catch (e) {
        console.warn('[Register DB Insert Error]', e.message);
      }
    }
    if (!newUser) {
      newUser = {
        id: `usr_${Date.now()}`,
        email: userEmail,
        password_hash: passHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'customer',
        created_at: new Date().toISOString()
      };
      USERS.set(userEmail, newUser);
    }

    const token = createJwt({
      id: String(newUser.id),
      email: newUser.email,
      role: newUser.role || 'customer',
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
    const refreshToken = createJwt({ id: String(newUser.id), type: 'refresh' });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      token,
      refresh_token: refreshToken,
      user: {
        id: String(newUser.id),
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role || 'customer',
      },
    }));
    return;
  }

  if (pathname === '/api/v3/store/customers/me') {
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'unauthorized', message: 'Authentication required' } }));
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      let updatedUser = null;
      if (dbPool) {
        try {
          const updates = [];
          const values = [];
          let idx = 1;
          if (body.first_name !== undefined) { updates.push(`first_name = $${idx++}`); values.push(body.first_name); }
          if (body.last_name !== undefined) { updates.push(`last_name = $${idx++}`); values.push(body.last_name); }
          if (body.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(body.phone); }
          if (body.password) { updates.push(`password_hash = $${idx++}`); values.push(hashPassword(body.password)); }
          updates.push(`updated_at = NOW()`);
          values.push(authUser.id);

          const dbRes = await dbPool.query(
            `UPDATE spree_users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, first_name, last_name, phone, role`,
            values
          );
          if (dbRes.rows.length > 0) updatedUser = dbRes.rows[0];
        } catch (e) {
          console.warn('[Update Me DB Error]', e.message);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: String(updatedUser?.id || authUser.id),
        email: updatedUser?.email || authUser.email,
        first_name: updatedUser?.first_name || body.first_name || authUser.first_name,
        last_name: updatedUser?.last_name || body.last_name || authUser.last_name,
        full_name: `${updatedUser?.first_name || body.first_name || ''} ${updatedUser?.last_name || body.last_name || ''}`.trim() || 'Mirza Patron',
        phone: updatedUser?.phone || body.phone || '',
        role: updatedUser?.role || authUser.role || 'customer',
      }));
      return;
    }

    // GET /api/v3/store/customers/me
    let user = null;
    if (dbPool) {
      try {
        const dbRes = await dbPool.query('SELECT id, email, first_name, last_name, phone, role FROM spree_users WHERE id = $1', [authUser.id]);
        if (dbRes.rows.length > 0) user = dbRes.rows[0];
      } catch (e) {
        console.warn('[Me DB Error]', e.message);
      }
    }
    if (!user) user = Array.from(USERS.values()).find(u => String(u.id) === String(authUser.id)) || authUser;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: String(user.id),
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Mirza Patron',
      phone: user.phone || '',
      role: user.role || 'customer',
    }));
    return;
  }

  if (pathname === '/api/v3/store/customers/me/orders') {
    const authUser = getAuthUserFromRequest(req);
    let ordersList = [];
    if (dbPool && authUser?.email) {
      try {
        const dbRes = await dbPool.query(
          'SELECT order_data FROM spree_orders WHERE LOWER(email) = LOWER($1) ORDER BY id DESC',
          [authUser.email]
        );
        ordersList = dbRes.rows.map(r => r.order_data);
      } catch (e) {
        console.warn('[Customer Orders DB Error]', e.message);
      }
    }
    if (ordersList.length === 0) {
      ordersList = Array.from(ORDERS.values()).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: ordersList,
      meta: { count: ordersList.length, total_count: ordersList.length, pages: 1 },
    }));
    return;
  }

  if (pathname === '/api/v3/store/customers/me/addresses') {
    const authUser = getAuthUserFromRequest(req);
    if (req.method === 'POST') {
      let newAddr = {
        id: `addr_${Date.now()}`,
        first_name: body.first_name || 'Mirza',
        last_name: body.last_name || 'Patron',
        address1: body.address1 || '',
        address2: body.address2 || '',
        city: body.city || '',
        state_name: body.state_name || '',
        country_iso: body.country_iso || 'in',
        zipcode: body.zipcode || '',
        phone: body.phone || '',
        default: true,
      };
      if (dbPool && authUser?.id) {
        try {
          const ins = await dbPool.query(
            `INSERT INTO spree_addresses (user_id, first_name, last_name, address1, address2, city, state_name, country_iso, zipcode, phone, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [authUser.id, newAddr.first_name, newAddr.last_name, newAddr.address1, newAddr.address2, newAddr.city, newAddr.state_name, newAddr.country_iso, newAddr.zipcode, newAddr.phone, true]
          );
          if (ins.rows.length > 0) newAddr = ins.rows[0];
        } catch (e) {
          console.warn('[Address DB Insert Error]', e.message);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newAddr));
      return;
    }

    let addresses = [];
    if (dbPool && authUser?.id) {
      try {
        const dbRes = await dbPool.query('SELECT * FROM spree_addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC', [authUser.id]);
        addresses = dbRes.rows;
      } catch (e) {
        console.warn('[Addresses DB Error]', e.message);
      }
    }
    if (addresses.length === 0) {
      addresses = [{
        id: 'addr_1',
        first_name: 'Mirza',
        last_name: 'Patron',
        address1: '42 Heritage Colaba Causeway',
        city: 'Mumbai',
        state_name: 'Maharashtra',
        country_iso: 'in',
        zipcode: '400001',
        phone: '+91 98765 43210',
        default: true,
      }];
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: addresses, meta: { count: addresses.length } }));
    return;
  }

  if (pathname.match(/^\/api\/v3\/store\/customers\/me\/addresses\/[^/]+$/) && req.method === 'DELETE') {
    const addrId = pathname.split('/').pop();
    if (dbPool) {
      try {
        await dbPool.query('DELETE FROM spree_addresses WHERE id = $1', [addrId]);
      } catch (e) {
        console.warn('[Address Delete Error]', e.message);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ========================================================
  // 11. Admin Console Management API Endpoints
  // ========================================================
  if (pathname === '/api/v3/admin/stats') {
    let totalRevenue = 0;
    let ordersCount = 0;
    let productsCount = PRODUCTS.length;
    let usersCount = 0;
    let recentOrders = [];

    if (dbPool) {
      try {
        const revRes = await dbPool.query("SELECT COALESCE(SUM(total), 0) as rev, COUNT(*) as cnt FROM spree_orders WHERE state = 'complete'");
        totalRevenue = parseFloat(revRes.rows[0]?.rev || 0);
        ordersCount = parseInt(revRes.rows[0]?.cnt || 0, 10);

        const userRes = await dbPool.query('SELECT COUNT(*) as cnt FROM spree_users');
        usersCount = parseInt(userRes.rows[0]?.cnt || 0, 10);

        const prodRes = await dbPool.query('SELECT COUNT(*) as cnt FROM spree_products');
        productsCount = parseInt(prodRes.rows[0]?.cnt || productsCount, 10);

        const recRes = await dbPool.query('SELECT number, email, total, currency, state, completed_at FROM spree_orders ORDER BY id DESC LIMIT 5');
        recentOrders = recRes.rows;
      } catch (e) {
        console.warn('[Admin Stats DB Error]', e.message);
      }
    }
    if (ordersCount === 0) {
      ordersCount = ORDERS.size;
      for (const ord of ORDERS.values()) totalRevenue += parseFloat(ord.total || 0);
      usersCount = USERS.size;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      revenue: totalRevenue,
      orders_count: ordersCount,
      products_count: productsCount,
      users_count: usersCount,
      recent_orders: recentOrders,
    }));
    return;
  }

  if (pathname === '/api/v3/admin/orders') {
    let ordersList = [];
    if (dbPool) {
      try {
        const dbRes = await dbPool.query('SELECT id, number, token, state, email, total, currency, order_data, completed_at, created_at FROM spree_orders ORDER BY id DESC');
        ordersList = dbRes.rows.map(r => ({
          id: r.id,
          number: r.number,
          email: r.email,
          total: r.total,
          currency: r.currency,
          state: r.state,
          payment_state: r.order_data?.payment_state || 'paid',
          shipment_state: r.order_data?.shipment_state || 'ready',
          items_count: r.order_data?.items?.length || 1,
          items: r.order_data?.items || [],
          completed_at: r.completed_at || r.created_at,
        }));
      } catch (e) {
        console.warn('[Admin Orders DB Error]', e.message);
      }
    }
    if (ordersList.length === 0) {
      ordersList = Array.from(ORDERS.values()).map(o => ({
        id: o.id,
        number: o.number,
        email: o.email || 'patron@mirzafootwear.com',
        total: o.total,
        currency: o.currency || 'USD',
        state: o.state || 'complete',
        payment_state: o.payment_state || 'paid',
        shipment_state: o.shipment_state || 'ready',
        items_count: o.items?.length || 1,
        items: o.items || [],
        completed_at: o.completed_at || new Date().toISOString(),
      }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: ordersList, meta: { count: ordersList.length } }));
    return;
  }

  if (pathname.match(/^\/api\/v3\/admin\/orders\/[^/]+$/) && (req.method === 'PATCH' || req.method === 'PUT')) {
    const orderNumber = pathname.split('/').pop();
    const newState = body.state;
    const newPaymentState = body.payment_state;
    const newShipmentState = body.shipment_state;

    if (dbPool) {
      try {
        if (newState) await dbPool.query('UPDATE spree_orders SET state = $1 WHERE number = $2', [newState, orderNumber]);
      } catch (e) {
        console.warn('[Admin Order Update Error]', e.message);
      }
    }
    const memOrder = ORDERS.get(orderNumber);
    if (memOrder) {
      if (newState) memOrder.state = newState;
      if (newPaymentState) memOrder.payment_state = newPaymentState;
      if (newShipmentState) memOrder.shipment_state = newShipmentState;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, number: orderNumber }));
    return;
  }

  if (pathname === '/api/v3/admin/inventory') {
    let inventoryList = [];
    if (dbPool) {
      try {
        const dbRes = await dbPool.query(`
          SELECT DISTINCT ON (v.id) p.id as product_id, p.name as product_name, p.slug, p.price, p.thumbnail_url,
                 v.id as variant_id, v.sku, v.size_option, COALESCE(si.count_on_hand, 0) as count_on_hand
          FROM spree_products p
          JOIN spree_variants v ON v.product_id = p.id
          LEFT JOIN spree_stock_items si ON si.variant_id = v.id
          ORDER BY v.id ASC, p.id ASC
        `);
        inventoryList = dbRes.rows;
      } catch (e) {
        console.warn('[Admin Inventory DB Error]', e.message);
      }
    }
    if (inventoryList.length === 0) {
      for (const prod of PRODUCTS) {
        for (const v of (prod.variants || [])) {
          inventoryList.push({
            product_id: prod.id,
            product_name: prod.name,
            slug: prod.slug,
            price: prod.price?.amount || '185.00',
            thumbnail_url: prod.thumbnail_url,
            variant_id: v.id,
            sku: v.sku,
            size_option: v.option_values?.[0]?.presentation || 'Standard',
            count_on_hand: v.stock || 15,
          });
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: inventoryList, meta: { count: inventoryList.length } }));
    return;
  }

  if (pathname.match(/^\/api\/v3\/admin\/inventory\/[^/]+$/) && (req.method === 'PATCH' || req.method === 'PUT')) {
    const variantId = pathname.split('/').pop();
    const newCount = Math.max(0, parseInt(body.count_on_hand || '0', 10));

    if (dbPool) {
      try {
        await dbPool.query(
          'UPDATE spree_stock_items SET count_on_hand = $1 WHERE variant_id = $2',
          [newCount, variantId]
        );
        await dbPool.query(`
          UPDATE spree_products SET total_on_hand = (
            SELECT COALESCE(SUM(si.count_on_hand), 0)
            FROM spree_variants v
            JOIN spree_stock_items si ON si.variant_id = v.id
            WHERE v.product_id = spree_products.id
          ), in_stock = (
            SELECT COALESCE(SUM(si.count_on_hand), 0) > 0
            FROM spree_variants v
            JOIN spree_stock_items si ON si.variant_id = v.id
            WHERE v.product_id = spree_products.id
          )
          WHERE id = (SELECT product_id FROM spree_variants WHERE id = $1)
        `, [variantId]);
        await syncCatalogFromDatabase();
      } catch (e) {
        console.warn('[Admin Stock Update Error]', e.message);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, variant_id: variantId, count_on_hand: newCount }));
    return;
  }

  if (pathname === '/api/v3/admin/customers') {
    let customersList = [];
    if (dbPool) {
      try {
        const dbRes = await dbPool.query(`
          SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at,
                 COUNT(o.id) as orders_count, COALESCE(SUM(o.total), 0) as lifetime_spend
          FROM spree_users u
          LEFT JOIN spree_orders o ON LOWER(o.email) = LOWER(u.email)
          GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
          ORDER BY u.id ASC
        `);
        customersList = dbRes.rows.map(r => ({
          id: r.id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          phone: r.phone,
          role: r.role,
          orders_count: parseInt(r.orders_count || 0, 10),
          lifetime_spend: parseFloat(r.lifetime_spend || 0),
          created_at: r.created_at,
        }));
      } catch (e) {
        console.warn('[Admin Customers DB Error]', e.message);
      }
    }
    if (customersList.length === 0) {
      customersList = Array.from(USERS.values()).map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        role: u.role,
        orders_count: 0,
        lifetime_spend: 0,
        created_at: u.created_at,
      }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: customersList, meta: { count: customersList.length } }));
    return;
  }

  if (pathname.match(/^\/api\/v3\/admin\/customers\/[^/]+\/role$/) && (req.method === 'PATCH' || req.method === 'PUT')) {
    const userId = pathname.split('/')[5];
    const newRole = body.role === 'admin' ? 'admin' : 'customer';
    if (dbPool) {
      try {
        await dbPool.query('UPDATE spree_users SET role = $1 WHERE id = $2', [newRole, userId]);
      } catch (e) {
        console.warn('[Admin User Role Error]', e.message);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, user_id: userId, role: newRole }));
    return;
  }

  if (pathname === '/api/v3/store/policies') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: [
        { id: 'pol_1', slug: 'shipping-policy', title: 'Shipping Policy', body: 'Free insured white-glove express delivery across India and worldwide on all handcrafted footwear.' },
        { id: 'pol_2', slug: 'return-policy', title: 'Return & Exchange Policy', body: '30-day doorstep trial and size exchange.' },
      ],
      meta: { count: 2 },
    }));
    return;
  }

  if (pathname.includes('/gift_cards') || pathname.includes('/store_credits') || pathname.includes('/credit_cards')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], meta: { count: 0 } }));
    return;
  }

  // Fallback for unhandled API calls
  console.log(`[Mock API fallback] ${req.method} ${pathname}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: [], meta: { count: 0 } }));
}

const isDirectRun = process.argv[1] && import.meta.url === url.pathToFileURL(process.argv[1]).href;
if (!process.env.VERCEL && isDirectRun) {
  server.listen(PORT, async () => {
    console.log(`==> Mock Spree Store API running at http://localhost:${PORT}`);
    if (dbPool) {
      await syncCatalogFromDatabase();
    }
    console.log(`==> Serving ${PRODUCTS.length} Mirza Footwear traditional and formal leather products across ${CATEGORIES.length} categories.`);
  });
}

export { PRODUCTS, CATEGORIES, MARKETS, COUNTRIES, handleRequest, syncCatalogFromDatabase, dbPool };
