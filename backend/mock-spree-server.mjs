/**
 * Mock Spree Commerce Store API v3 Server for Mirza Footwear
 * Enables instant local development and build verification when Docker is not active.
 */

import http from 'node:http';
import url from 'node:url';

const PORT = parseInt(process.env.SPREE_PORT || '4000', 10);

const MARKETS = [
  {
    id: 'market_us',
    code: 'us',
    name: 'United States',
    default_country: { iso: 'us', name: 'United States' },
    default_locale: 'en',
    currencies: ['USD'],
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
];

const CATEGORIES = [
  {
    id: 'cat_running',
    name: 'Running',
    permalink: 'running',
    description: 'Engineered for speed, endurance, and marathon cushioning.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_lifestyle',
    name: 'Lifestyle & Sneakers',
    permalink: 'lifestyle',
    description: 'Iconic street silhouettes crafted with premium leather and suede.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_basketball',
    name: 'Basketball',
    permalink: 'basketball',
    description: 'High-traction court footwear built for explosive propulsion.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_trail',
    name: 'Trail & Outdoor',
    permalink: 'trail-outdoor',
    description: 'Rugged all-weather grip and waterproof Gore-Tex membranes.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
];

const PRODUCTS = [
  {
    id: 'prod_mirza_velocity_pro',
    name: 'Mirza Velocity Carbon Pro',
    slug: 'mirza-velocity-carbon-pro',
    description: 'Elite carbon-plated marathon racer with dynamic supercritical foam energy return.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_1',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Velocity Carbon Pro in Inferno Red',
    },
    media: [
      {
        id: 'med_1',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Velocity Carbon Pro in Inferno Red',
      },
      {
        id: 'med_1b',
        url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Velocity Carbon Pro sole profile',
      },
    ],
    price: {
      display_amount: '$220.00',
      amount_in_cents: 22000,
      compare_at_amount_in_cents: 25000,
      display_compare_at_amount: '$250.00',
    },
    original_price: {
      display_amount: '$250.00',
      amount_in_cents: 25000,
    },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_vel_1',
    variants: [
      {
        id: 'var_vel_1',
        is_master: true,
        sku: 'MIRZA-VEL-001',
        in_stock: true,
        price: { display_amount: '$220.00', amount_in_cents: 22000 },
        options_text: 'Size: US 9, Color: Inferno Red',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'US 9' },
          { id: 'opt_col_red', option_type_name: 'color', presentation: 'Inferno Red' },
        ],
      },
      {
        id: 'var_vel_2',
        is_master: false,
        sku: 'MIRZA-VEL-002',
        in_stock: true,
        price: { display_amount: '$220.00', amount_in_cents: 22000 },
        options_text: 'Size: US 10, Color: Inferno Red',
        option_values: [
          { id: 'opt_sz_10', option_type_name: 'size', presentation: 'US 10' },
          { id: 'opt_col_red', option_type_name: 'color', presentation: 'Inferno Red' },
        ],
      },
      {
        id: 'var_vel_3',
        is_master: false,
        sku: 'MIRZA-VEL-003',
        in_stock: true,
        price: { display_amount: '$220.00', amount_in_cents: 22000 },
        options_text: 'Size: US 11, Color: Inferno Red',
        option_values: [
          { id: 'opt_sz_11', option_type_name: 'size', presentation: 'US 11' },
          { id: 'opt_col_red', option_type_name: 'color', presentation: 'Inferno Red' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_heritage_low',
    name: 'Mirza Heritage Classic Low',
    slug: 'mirza-heritage-classic-low',
    description: 'Timeless luxury court sneaker handcrafted with Italian full-grain nappa leather.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_2',
      url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Heritage Classic Low in Off-White & Gum',
    },
    media: [
      {
        id: 'med_2',
        url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Heritage Classic Low in Off-White & Gum',
      },
    ],
    price: {
      display_amount: '$165.00',
      amount_in_cents: 16500,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
    },
    original_price: {
      display_amount: '$165.00',
      amount_in_cents: 16500,
    },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_her_1',
    variants: [
      {
        id: 'var_her_1',
        is_master: true,
        sku: 'MIRZA-HER-001',
        in_stock: true,
        price: { display_amount: '$165.00', amount_in_cents: 16500 },
        options_text: 'Size: US 9, Color: Off-White Gum',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'US 9' },
          { id: 'opt_col_wht', option_type_name: 'color', presentation: 'Off-White Gum' },
        ],
      },
      {
        id: 'var_her_2',
        is_master: false,
        sku: 'MIRZA-HER-002',
        in_stock: true,
        price: { display_amount: '$165.00', amount_in_cents: 16500 },
        options_text: 'Size: US 10, Color: Off-White Gum',
        option_values: [
          { id: 'opt_sz_10', option_type_name: 'size', presentation: 'US 10' },
          { id: 'opt_col_wht', option_type_name: 'color', presentation: 'Off-White Gum' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_court_dominance',
    name: 'Mirza Court Dominance High',
    slug: 'mirza-court-dominance-high',
    description: 'Ankle-locked basketball sneaker engineered with high-impact dual-density air cushioning.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_3',
      url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Court Dominance High in Cyber Blue',
    },
    media: [
      {
        id: 'med_3',
        url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Court Dominance High in Cyber Blue',
      },
    ],
    price: {
      display_amount: '$190.00',
      amount_in_cents: 19000,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
    },
    original_price: {
      display_amount: '$190.00',
      amount_in_cents: 19000,
    },
    categories: [CATEGORIES[2]],
    default_variant_id: 'var_crt_1',
    variants: [
      {
        id: 'var_crt_1',
        is_master: true,
        sku: 'MIRZA-CRT-001',
        in_stock: true,
        price: { display_amount: '$190.00', amount_in_cents: 19000 },
        options_text: 'Size: US 9.5, Color: Cyber Blue',
        option_values: [
          { id: 'opt_sz_95', option_type_name: 'size', presentation: 'US 9.5' },
          { id: 'opt_col_blue', option_type_name: 'color', presentation: 'Cyber Blue' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_alpine_trail',
    name: 'Mirza Alpine GTX Trail',
    slug: 'mirza-alpine-gtx-trail',
    description: 'Vibram Megagrip lugged waterproof hiker designed for scree, mud, and alpine scrambles.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_4',
      url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Alpine GTX Trail in Olive Stealth',
    },
    media: [
      {
        id: 'med_4',
        url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Alpine GTX Trail in Olive Stealth',
      },
    ],
    price: {
      display_amount: '$180.00',
      amount_in_cents: 18000,
      compare_at_amount_in_cents: 20000,
      display_compare_at_amount: '$200.00',
    },
    original_price: {
      display_amount: '$200.00',
      amount_in_cents: 20000,
    },
    categories: [CATEGORIES[3]],
    default_variant_id: 'var_alp_1',
    variants: [
      {
        id: 'var_alp_1',
        is_master: true,
        sku: 'MIRZA-ALP-001',
        in_stock: true,
        price: { display_amount: '$180.00', amount_in_cents: 18000 },
        options_text: 'Size: US 10, Color: Olive Stealth',
        option_values: [
          { id: 'opt_sz_10', option_type_name: 'size', presentation: 'US 10' },
          { id: 'opt_col_olv', option_type_name: 'color', presentation: 'Olive Stealth' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
];

let activeCart = {
  id: 'cart_mirza_001',
  number: 'R849204918',
  token: 'guest_cart_token_mirza',
  item_total: '0.00',
  total: '0.00',
  currency: 'USD',
  line_items: [],
  shipments: [],
  adjustments: [],
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Spree-Publishable-Key, X-Spree-Channel');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/up') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Store API routes
  if (pathname === '/api/v3/store/markets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: MARKETS, meta: { count: MARKETS.length } }));
    return;
  }

  if (pathname === '/api/v3/store/countries') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: COUNTRIES, meta: { count: COUNTRIES.length } }));
    return;
  }

  if (pathname.startsWith('/api/v3/store/countries/')) {
    const iso = pathname.split('/').pop().toLowerCase();
    const country = COUNTRIES.find(c => c.iso === iso) || COUNTRIES[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: country }));
    return;
  }

  if (pathname === '/api/v3/store/categories') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: CATEGORIES, meta: { count: CATEGORIES.length, total_count: CATEGORIES.length } }));
    return;
  }

  if (pathname.startsWith('/api/v3/store/categories/')) {
    const slug = pathname.split('/').pop();
    const category = CATEGORIES.find(c => c.permalink === slug || c.id === slug) || CATEGORIES[0];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: category }));
    return;
  }

  if (pathname === '/api/v3/store/products') {
    const query = (parsedUrl.query.q || '').toLowerCase();
    let filtered = PRODUCTS;
    if (query) {
      filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: filtered,
      meta: {
        count: filtered.length,
        total_count: filtered.length,
        total_pages: 1,
      },
    }));
    return;
  }

  if (pathname === '/api/v3/store/products/filters') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: {
        price: { min: 165, max: 250 },
        categories: CATEGORIES.map(c => ({ id: c.id, name: c.name, count: 1 })),
        option_types: [
          {
            name: 'size',
            presentation: 'Size',
            option_values: [
              { id: 'opt_sz_9', presentation: 'US 9', count: 2 },
              { id: 'opt_sz_10', presentation: 'US 10', count: 3 },
            ],
          },
        ],
      },
    }));
    return;
  }

  if (pathname.startsWith('/api/v3/store/products/')) {
    const slugOrId = pathname.split('/').pop();
    const product = PRODUCTS.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Product not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: product }));
    return;
  }

  if (pathname === '/api/v3/store/cart') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: activeCart }));
    return;
  }

  if (pathname === '/api/v3/store/channel') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: {
        code: 'default',
        name: 'Mirza Footwear Default Channel',
        storefront_access: 'public',
        guest_checkout_allowed: true,
      },
    }));
    return;
  }

  if (pathname === '/api/v3/store/policies') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: [
        { id: 'pol_1', slug: 'shipping-policy', title: 'Shipping Policy', body: 'Free express shipping on all footwear orders over $100.' },
        { id: 'pol_2', slug: 'return-policy', title: 'Return Policy', body: '30-day wear test with hassle-free returns.' },
      ],
      meta: { count: 2 },
    }));
    return;
  }

  if (pathname === '/api/v3/store/customer/gift_cards' || pathname === '/api/v3/store/gift_cards') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], meta: { count: 0 } }));
    return;
  }

  // Fallback for unhandled API calls
  console.log(`[Mock API fallback] ${req.method} ${pathname}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: [], meta: { count: 0 } }));
});

server.listen(PORT, () => {
  console.log(`==> Mock Spree Store API running at http://localhost:${PORT}`);
  console.log(`==> Serving ${PRODUCTS.length} Mirza Footwear products across ${CATEGORIES.length} categories.`);
});
