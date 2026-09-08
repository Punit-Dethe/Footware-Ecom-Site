/**
 * Mock Spree Commerce Store API v3 Server for Mirza Footwear
 * Handcrafted Indian, Formal Office, and Traditional Leather Footwear.
 */

import http from 'node:http';
import url from 'node:url';

const PORT = parseInt(process.env.SPREE_PORT || '4000', 10);

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
    description: 'Goodyear-welted Oxfords, Brogues, and Monk Straps for boardroom distinction.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_traditional',
    name: 'Traditional Indian Footwear',
    permalink: 'traditional-indian',
    description: 'Ceremonial Juttis, authentic Mojaris, handcrafted Kolhapuris, and royal Peshawaris.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_loafers',
    name: 'Loafers & Slip-Ons',
    permalink: 'loafers-slip-ons',
    description: 'Saddle Penny Loafers and Venetian slip-ons handcrafted from vegetable-tanned leather.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: 'cat_boots',
    name: 'Leather Boots',
    permalink: 'boots-leather',
    description: 'Refined Chelsea and Chukka boots with burnished patina and all-day comfort.',
    parent_id: null,
    children: [],
    ancestors: [],
  },
];

const PRODUCTS = [
  {
    id: 'prod_mirza_imperial_oxford',
    name: 'Mirza Imperial Wholecut Oxford',
    slug: 'mirza-imperial-wholecut-oxford',
    description: 'Crafted from a single flawless piece of hand-selected Italian full-grain calfskin with hand-burnished mahogany patina. Features Goodyear welted construction, bevelled leather waist, and cork-filled footbed.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_ox_1',
      url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Imperial Wholecut Oxford in Mahogany Tan',
    },
    media: [
      {
        id: 'med_ox_1',
        url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Imperial Wholecut Oxford in Mahogany Tan',
      },
      {
        id: 'med_ox_2',
        url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Imperial Wholecut Oxford leather detail',
      },
    ],
    price: {
      display_amount: '$185.00',
      amount_in_cents: 18500,
      compare_at_amount_in_cents: 22000,
      display_compare_at_amount: '$220.00',
    },
    original_price: {
      display_amount: '$220.00',
      amount_in_cents: 22000,
    },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_ox_1',
    variants: [
      {
        id: 'var_ox_1',
        is_master: true,
        sku: 'MRZ-OX-BRN-08',
        in_stock: true,
        price: { display_amount: '$185.00', amount_in_cents: 18500 },
        options_text: 'Size: UK/India 8, Color: Mahogany Tan',
        option_values: [
          { id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' },
          { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' },
        ],
      },
      {
        id: 'var_ox_2',
        is_master: false,
        sku: 'MRZ-OX-BRN-09',
        in_stock: true,
        price: { display_amount: '$185.00', amount_in_cents: 18500 },
        options_text: 'Size: UK/India 9, Color: Mahogany Tan',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' },
        ],
      },
      {
        id: 'var_ox_3',
        is_master: false,
        sku: 'MRZ-OX-BRN-10',
        in_stock: true,
        price: { display_amount: '$185.00', amount_in_cents: 18500 },
        options_text: 'Size: UK/India 10, Color: Mahogany Tan',
        option_values: [
          { id: 'opt_sz_10', option_type_name: 'size', presentation: 'UK/India 10' },
          { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Mahogany Tan' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_royal_brogue',
    name: 'Mirza Royal Wingtip Brogue',
    slug: 'mirza-royal-wingtip-brogue',
    description: 'Classic full-wingtip silhouette with hand-punched medallion broguing. Built on traditional English lasts with oak-bark tanned leather outsoles and channelled stitching.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_br_1',
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Royal Wingtip Brogue in Antique Cognac',
    },
    media: [
      {
        id: 'med_br_1',
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Royal Wingtip Brogue in Antique Cognac',
      },
    ],
    price: {
      display_amount: '$170.00',
      amount_in_cents: 17000,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
    },
    original_price: {
      display_amount: '$170.00',
      amount_in_cents: 17000,
    },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_br_1',
    variants: [
      {
        id: 'var_br_1',
        is_master: true,
        sku: 'MRZ-BRG-COG-09',
        in_stock: true,
        price: { display_amount: '$170.00', amount_in_cents: 17000 },
        options_text: 'Size: UK/India 9, Color: Antique Cognac',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_cog', option_type_name: 'color', presentation: 'Antique Cognac' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_artisan_jutti',
    name: 'Mirza Royal Embroidered Jutti',
    slug: 'mirza-royal-embroidered-jutti',
    description: 'Traditional handcrafted Indian ceremonial jutti created by master artisans. Pure supple leather with intricate gold-thread dabka & zardozi embroidery, curved toe, and double-padded insole for royal occasions.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_jt_1',
      url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Royal Embroidered Jutti in Regal Gold and Velvet',
    },
    media: [
      {
        id: 'med_jt_1',
        url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Royal Embroidered Jutti in Regal Gold and Velvet',
      },
    ],
    price: {
      display_amount: '$95.00',
      amount_in_cents: 9500,
      compare_at_amount_in_cents: 12000,
      display_compare_at_amount: '$120.00',
    },
    original_price: {
      display_amount: '$120.00',
      amount_in_cents: 12000,
    },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_jt_1',
    variants: [
      {
        id: 'var_jt_1',
        is_master: true,
        sku: 'MRZ-JUT-GLD-08',
        in_stock: true,
        price: { display_amount: '$95.00', amount_in_cents: 9500 },
        options_text: 'Size: UK/India 8, Color: Regal Gold',
        option_values: [
          { id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' },
          { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' },
        ],
      },
      {
        id: 'var_jt_2',
        is_master: false,
        sku: 'MRZ-JUT-GLD-09',
        in_stock: true,
        price: { display_amount: '$95.00', amount_in_cents: 9500 },
        options_text: 'Size: UK/India 9, Color: Regal Gold',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_gld', option_type_name: 'color', presentation: 'Regal Gold' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_double_monk',
    name: 'Mirza Heritage Double Monk Strap',
    slug: 'mirza-heritage-double-monk-strap',
    description: 'Architectural chisel toe with dual solid brass equestrian buckles. Hand-glazed French calf leather in a deep oxblood patina, lined with glove-soft lambskin.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_mk_1',
      url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Heritage Double Monk Strap in Deep Oxblood',
    },
    media: [
      {
        id: 'med_mk_1',
        url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Heritage Double Monk Strap in Deep Oxblood',
      },
    ],
    price: {
      display_amount: '$175.00',
      amount_in_cents: 17500,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
    },
    original_price: {
      display_amount: '$175.00',
      amount_in_cents: 17500,
    },
    categories: [CATEGORIES[0]],
    default_variant_id: 'var_mk_1',
    variants: [
      {
        id: 'var_mk_1',
        is_master: true,
        sku: 'MRZ-MNK-OXB-09',
        in_stock: true,
        price: { display_amount: '$175.00', amount_in_cents: 17500 },
        options_text: 'Size: UK/India 9, Color: Deep Oxblood',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_oxb', option_type_name: 'color', presentation: 'Deep Oxblood' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_peshawari_sandal',
    name: 'Mirza Handcrafted Peshawari Sandal',
    slug: 'mirza-handcrafted-peshawari-sandal',
    description: 'Traditional North Indian & heritage Peshawari silhouette with cross-over premium bridle leather straps, adjustable buckle backstay, and durable dual-stitch Goodyear sole.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_ps_1',
      url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Handcrafted Peshawari Sandal in Rustic Tan',
    },
    media: [
      {
        id: 'med_ps_1',
        url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Handcrafted Peshawari Sandal in Rustic Tan',
      },
    ],
    price: {
      display_amount: '$90.00',
      amount_in_cents: 9000,
      compare_at_amount_in_cents: 11000,
      display_compare_at_amount: '$110.00',
    },
    original_price: {
      display_amount: '$110.00',
      amount_in_cents: 11000,
    },
    categories: [CATEGORIES[1]],
    default_variant_id: 'var_ps_1',
    variants: [
      {
        id: 'var_ps_1',
        is_master: true,
        sku: 'MRZ-PSH-TAN-08',
        in_stock: true,
        price: { display_amount: '$90.00', amount_in_cents: 9000 },
        options_text: 'Size: UK/India 8, Color: Rustic Tan',
        option_values: [
          { id: 'opt_sz_8', option_type_name: 'size', presentation: 'UK/India 8' },
          { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Rustic Tan' },
        ],
      },
      {
        id: 'var_ps_2',
        is_master: false,
        sku: 'MRZ-PSH-TAN-09',
        in_stock: true,
        price: { display_amount: '$90.00', amount_in_cents: 9000 },
        options_text: 'Size: UK/India 9, Color: Rustic Tan',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_tan', option_type_name: 'color', presentation: 'Rustic Tan' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_penny_loafer',
    name: 'Mirza Classic Saddle Penny Loafer',
    slug: 'mirza-classic-saddle-penny-loafer',
    description: 'Unstructured comfort meets formal office elegance. Hand-sewn moc-toe with traditional diamond cut-out strap in rich espresso pull-up leather.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_lf_1',
      url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Classic Saddle Penny Loafer in Espresso Brown',
    },
    media: [
      {
        id: 'med_lf_1',
        url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Classic Saddle Penny Loafer in Espresso Brown',
      },
    ],
    price: {
      display_amount: '$155.00',
      amount_in_cents: 15500,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
    },
    original_price: {
      display_amount: '$155.00',
      amount_in_cents: 15500,
    },
    categories: [CATEGORIES[2]],
    default_variant_id: 'var_lf_1',
    variants: [
      {
        id: 'var_lf_1',
        is_master: true,
        sku: 'MRZ-PNY-ESP-09',
        in_stock: true,
        price: { display_amount: '$155.00', amount_in_cents: 15500 },
        options_text: 'Size: UK/India 9, Color: Espresso Brown',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_esp', option_type_name: 'color', presentation: 'Espresso Brown' },
        ],
      },
    ],
    option_types: [
      { id: 'ot_size', name: 'size', presentation: 'Size' },
      { id: 'ot_color', name: 'color', presentation: 'Color' },
    ],
  },
  {
    id: 'prod_mirza_chelsea_boot',
    name: 'Mirza Executive Chelsea Boot',
    slug: 'mirza-executive-chelsea-boot',
    description: 'Clean whole-cut upper crafted from burnished walnut calfskin. High-elastic side webbing, leather pull-tabs, and sleek low-profile rubber city sole for year-round office wear.',
    purchasable: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=600&q=80',
    primary_media: {
      id: 'med_ch_1',
      url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1200&q=85',
      alt: 'Mirza Executive Chelsea Boot in Walnut Calfskin',
    },
    media: [
      {
        id: 'med_ch_1',
        url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=1200&q=85',
        alt: 'Mirza Executive Chelsea Boot in Walnut Calfskin',
      },
    ],
    price: {
      display_amount: '$195.00',
      amount_in_cents: 19500,
      compare_at_amount_in_cents: 23000,
      display_compare_at_amount: '$230.00',
    },
    original_price: {
      display_amount: '$230.00',
      amount_in_cents: 23000,
    },
    categories: [CATEGORIES[3]],
    default_variant_id: 'var_ch_1',
    variants: [
      {
        id: 'var_ch_1',
        is_master: true,
        sku: 'MRZ-CHL-WAL-09',
        in_stock: true,
        price: { display_amount: '$195.00', amount_in_cents: 19500 },
        options_text: 'Size: UK/India 9, Color: Walnut Calfskin',
        option_values: [
          { id: 'opt_sz_9', option_type_name: 'size', presentation: 'UK/India 9' },
          { id: 'opt_col_wal', option_type_name: 'color', presentation: 'Walnut Calfskin' },
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
        price: { min: 80, max: 195 },
        categories: CATEGORIES.map(c => ({ id: c.id, name: c.name, count: 2 })),
        option_types: [
          {
            name: 'size',
            presentation: 'Size',
            option_values: [
              { id: 'opt_sz_8', presentation: 'UK/India 8', count: 4 },
              { id: 'opt_sz_9', presentation: 'UK/India 9', count: 6 },
              { id: 'opt_sz_10', presentation: 'UK/India 10', count: 3 },
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
        { id: 'pol_1', slug: 'shipping-policy', title: 'Shipping Policy', body: 'Free insured express delivery across India and worldwide on all footwear orders.' },
        { id: 'pol_2', slug: 'return-policy', title: 'Return & Exchange Policy', body: '30-day hassle-free doorstep size exchange and returns.' },
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
  console.log(`==> Serving ${PRODUCTS.length} Mirza Footwear traditional and formal leather footwear products across ${CATEGORIES.length} categories.`);
});
