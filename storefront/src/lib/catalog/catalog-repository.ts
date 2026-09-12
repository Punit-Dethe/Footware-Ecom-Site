import manifestData from "@/lib/media/manifest.json";
import type { ProductMedia } from "@/lib/media/types";

export type { ProductMedia };

export interface CatalogMedia {
  id: string;
  url: string;
  alt: string;
  position?: number;
  media_type?: string;
  original_url?: string;
  large_url?: string;
  xlarge_url?: string;
  small_url?: string;
  mini_url?: string;
  variant_ids?: string[];
  focal_point_x?: number;
  focal_point_y?: number;
}

export interface CatalogOptionValue {
  id: string;
  option_type_id: string;
  name: string;
  label: string;
  position: number;
  color_code: string | null;
  option_type_name: string;
  option_type_label: string;
  presentation?: string;
  image_url: string | null;
}

export interface CatalogOptionType {
  id: string;
  name: string;
  label: string;
  position: number;
  kind: string;
  presentation?: string;
}

export interface CatalogVariant {
  id: string;
  product_id?: string;
  is_master: boolean;
  sku: string;
  in_stock: boolean;
  purchasable: boolean;
  track_inventory?: boolean;
  price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
    compare_at_amount_in_cents?: number;
    display_compare_at_amount?: string;
  };
  original_price?: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
  };
  options_text: string;
  option_values: CatalogOptionValue[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  permalink: string;
  description: string;
  parent_id: string | null;
  children: CatalogCategory[];
  ancestors: CatalogCategory[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  description_html: string;
  purchasable: boolean;
  in_stock: boolean;
  thumbnail_url: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  primary_media: CatalogMedia;
  media: CatalogMedia[];
  product_media?: ProductMedia;
  price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
    compare_at_amount?: string;
    compare_at_amount_in_cents?: number;
    display_compare_at_amount?: string;
  };
  original_price: {
    amount?: string;
    currency?: string;
    display_amount: string;
    amount_in_cents: number;
  };
  categories: CatalogCategory[];
  default_variant_id: string;
  default_variant?: CatalogVariant;
  variants: CatalogVariant[];
  option_types: CatalogOptionType[];
}

// 1. Categories
export const CATEGORIES: CatalogCategory[] = [
  {
    id: "7",
    name: "Office Wear",
    permalink: "categories/office-wear",
    description:
      "Goodyear-welted Oxfords, Brogues, Monk Straps, and Derbies handcrafted for boardroom distinction.",
    parent_id: null,
    children: [],
    ancestors: [],
  },
  {
    id: "8",
    name: "Traditional",
    permalink: "categories/traditional",
    description:
      "Ceremonial Royal Juttis, authentic Mojaris, handcrafted Kolhapuris, and bridal Peshawaris.",
    parent_id: null,
    children: [],
    ancestors: [],
  },
];

// Raw definitions for the 38 products
const RAW_OFFICE_PRODUCTS = [
  {
    name: "The Sovereign Wholecut Oxford",
    price: 285.0,
    sku: "MIRZA-OFF-001",
    desc: "Crafted from a single piece of flawless Italian calfskin leather with closed lacing and Goodyear-welted sole.",
  },
  {
    name: "The Heritage Wingtip Derby",
    price: 265.0,
    sku: "MIRZA-OFF-002",
    desc: "Classic open-laced derby featuring intricate broguing, burnished chestnut leather, and stacked heel.",
  },
  {
    name: "The Kensington Penny Loafer",
    price: 245.0,
    sku: "MIRZA-OFF-003",
    desc: "Timeless slip-on silhouette in velvety espresso suede with hand-stitched apron detailing.",
  },
  {
    name: "The Mayfair Chelsea Boot",
    price: 320.0,
    sku: "MIRZA-OFF-004",
    desc: "Sleek ankle-high Chelsea boot in supple black calfskin with elasticated gussets and rubber storm welt.",
  },
  {
    name: "The Westminster Double Monk Strap",
    price: 295.0,
    sku: "MIRZA-OFF-005",
    desc: "Elegant double buckle monk strap featuring hand-burnished burgundy leather and brass hardware.",
  },
  {
    name: "The Belgravia Cap-Toe Oxford",
    price: 275.0,
    sku: "MIRZA-OFF-006",
    desc: "Quintessential formal cap-toe oxford in deep black box calf leather, perfect for executive attire.",
  },
  {
    name: "The Piccadilly Tassel Loafer",
    price: 255.0,
    sku: "MIRZA-OFF-007",
    desc: "Refined tassel loafer crafted from supple dark oak calfskin with a Goodyear-welted leather sole.",
  },
  {
    name: "The St. James Quarter Brogue",
    price: 280.0,
    sku: "MIRZA-OFF-008",
    desc: "Sophisticated dress shoe featuring subtle toe-cap perforations and hand-waxed finishing.",
  },
  {
    name: "The Mayfair Chukka Boot",
    price: 290.0,
    sku: "MIRZA-OFF-009",
    desc: "Three-eyelet ankle boot in water-resistant suede with a lightweight studded rubber sole.",
  },
  {
    name: "The Royal Single Monk Strap",
    price: 270.0,
    sku: "MIRZA-OFF-010",
    desc: "Minimalist single-buckle monk strap offering a streamlined silhouette for modern suiting.",
  },
  {
    name: "The Savoy Medallion Oxford",
    price: 295.0,
    sku: "MIRZA-OFF-011",
    desc: "Distinguished oxford featuring an artisanal punched medallion toe and hand-burnished tan patina.",
  },
  {
    name: "The Knightsbridge Plain Derby",
    price: 260.0,
    sku: "MIRZA-OFF-012",
    desc: "Understated blucher shoe with clean lines, premium French leather, and cushioned leather insole.",
  },
  {
    name: "The Burlington Bit Loafer",
    price: 270.0,
    sku: "MIRZA-OFF-013",
    desc: "Italian-inspired loafer adorned with polished silver horsebit hardware on supple grain leather.",
  },
  {
    name: "The Carlton Brogue Derby",
    price: 285.0,
    sku: "MIRZA-OFF-014",
    desc: "Country calf brogue derby with heavy perforation detail and durable commando rubber sole.",
  },
  {
    name: "The Grosvenor Dress Boot",
    price: 340.0,
    sku: "MIRZA-OFF-015",
    desc: "Executive high-ankle lace-up dress boot with speed hooks and channel-stitched leather sole.",
  },
  {
    name: "The Oxford Adelaide Brogue",
    price: 310.0,
    sku: "MIRZA-OFF-016",
    desc: "Unique Adelaide throat styling with sweeping brogue contours in hand-painted museum calf.",
  },
  {
    name: "The Chelsea Goodyear Boot",
    price: 325.0,
    sku: "MIRZA-OFF-017",
    desc: "Heavyweight Chelsea boot in full-grain waxy pull-up leather with Goodyear welted construction.",
  },
  {
    name: "The Whitehall Executive Loafer",
    price: 250.0,
    sku: "MIRZA-OFF-018",
    desc: "Tailored dress loafer designed for all-day comfort with concealed elastic arch support.",
  },
  {
    name: "The Sovereign Split-Toe Derby",
    price: 290.0,
    sku: "MIRZA-OFF-019",
    desc: "Hand-sewn Norwegian split-toe derby showcasing master leather craftsmanship.",
  },
];

const RAW_TRADITIONAL_PRODUCTS = [
  {
    name: "The Royal Dabka Zardozi Jutti",
    price: 210.0,
    sku: "MIRZA-TRD-020",
    desc: "Hand-embroidered with authentic gold Dabka wire and Zardozi floral motifs on midnight blue velvet.",
  },
  {
    name: "The Ceremonial Velvet Mojari",
    price: 225.0,
    sku: "MIRZA-TRD-021",
    desc: "Curled-toe celebratory mojari with intricate silver Resham embroidery on rich crimson velvet.",
  },
  {
    name: "The Handcrafted Peshawari Sandal",
    price: 195.0,
    sku: "MIRZA-TRD-022",
    desc: "Heritage two-piece semi-closed sandal in vegetable-tanned mustard leather with tire-sole grip.",
  },
  {
    name: "The Artisan Kolhapuri Chappal",
    price: 180.0,
    sku: "MIRZA-TRD-023",
    desc: "Authentic hand-braided leather chappal made from untreated raw leather using age-old tanning techniques.",
  },
  {
    name: "The Maharaja Gold Embroidered Jutti",
    price: 250.0,
    sku: "MIRZA-TRD-024",
    desc: "Opulent wedding jutti covered in high-density gold zari work with cushioned leather footbed.",
  },
  {
    name: "The Moghul Silk Brocade Mojari",
    price: 230.0,
    sku: "MIRZA-TRD-025",
    desc: "Crafted from handloom Banarasi silk brocade featuring intricate floral booti patterns.",
  },
  {
    name: "The Regal Tilla Work Jutti",
    price: 215.0,
    sku: "MIRZA-TRD-026",
    desc: "Traditional Kashmiri tilla needlework in geometric arabesque patterns on supple camel leather.",
  },
  {
    name: "The Classic Leather Peshawari",
    price: 205.0,
    sku: "MIRZA-TRD-027",
    desc: "Sturdy dark walnut Peshawari sandal with cross-over leather straps and hand-waxed finish.",
  },
  {
    name: "The Braided Kolhapuri Slide",
    price: 185.0,
    sku: "MIRZA-TRD-028",
    desc: "Contemporary slide variant of the iconic Kolhapuri with braided toe loop and brass rivets.",
  },
  {
    name: "The Shehnai Wedding Mojari",
    price: 240.0,
    sku: "MIRZA-TRD-029",
    desc: "Ivory raw silk mojari adorned with pearl beads and golden sequins, crafted for auspicious occasions.",
  },
  {
    name: "The Noor Jahan Velvet Jutti",
    price: 220.0,
    sku: "MIRZA-TRD-030",
    desc: "Plush emerald velvet jutti lined with soft sheepskin, featuring delicate silver gota embroidery.",
  },
  {
    name: "The Jodhpur Hand-Tooled Jutti",
    price: 210.0,
    sku: "MIRZA-TRD-031",
    desc: "Richly embossed leather jutti handcrafted by master artisans in Rajasthan.",
  },
  {
    name: "The Patiala Resham Thread Jutti",
    price: 195.0,
    sku: "MIRZA-TRD-032",
    desc: "Vibrant multicolor silk thread needlework on tanned cowhide with padded insole.",
  },
  {
    name: "The Awadh Embroidered Khussa",
    price: 235.0,
    sku: "MIRZA-TRD-033",
    desc: "Aristocratic curved khussa with dense silver tilla stitching inspired by Awadhi royal courts.",
  },
  {
    name: "The Banarasi Brocade Mojari",
    price: 225.0,
    sku: "MIRZA-TRD-034",
    desc: "Woven golden zari on royal purple silk fabric, lined with natural goat leather.",
  },
  {
    name: "The Jaipur Block-Print Jutti",
    price: 190.0,
    sku: "MIRZA-TRD-035",
    desc: "Cotton canvas upper featuring traditional Sanganeri block prints with leather sole.",
  },
  {
    name: "The Vintage Chamba Sandal",
    price: 185.0,
    sku: "MIRZA-TRD-036",
    desc: "Embroidered leather strappy sandal originating from Himachal heritage traditions.",
  },
  {
    name: "The Shahzadi Pearl-Work Jutti",
    price: 265.0,
    sku: "MIRZA-TRD-037",
    desc: "Exquisite bridal footwear encrusted with faux river pearls and intricate metallic lace.",
  },
  {
    name: "The Royal Dastarkhan Slip-On",
    price: 215.0,
    sku: "MIRZA-TRD-038",
    desc: "Casual luxury slip-on jutti designed for festive evenings with effortless comfort.",
  },
];

const typedManifest = manifestData as Record<
  string,
  {
    slug: string;
    hash: string;
    dominantColor: string;
    lqip: string;
    mainUrl: string;
    variants: Record<string, { avif: string; webp: string }>;
  }
>;

function buildCatalogProduct(
  raw: { name: string; price: number; sku: string; desc: string },
  index: number,
  category: CatalogCategory,
): CatalogProduct {
  const numStr = String(index + 1).padStart(2, "0");
  const isOffice = category.id === "7";
  const slug = isOffice
    ? `office-footwear-${numStr}`
    : `traditional-footwear-${numStr}`;
  const prodId = `prod_mirza_${slug.replace(/-/g, "_")}`;
  const manifest = typedManifest[slug];

  const primaryUrl =
    manifest?.variants?.["640"]?.webp ||
    manifest?.mainUrl ||
    `/products/${slug}/card-lg-640.webp`;
  const originalUrl = manifest?.variants?.["1600"]?.webp || primaryUrl;
  const thumbUrl = manifest?.variants?.["320"]?.webp || primaryUrl;

  const cents = Math.round(raw.price * 100);
  const displayAmount = `$${raw.price.toFixed(2)}`;
  const displayCompareAmount = `$${(raw.price * 1.15).toFixed(2)}`;
  const amountStr = raw.price.toFixed(2);
  const compareStr = (raw.price * 1.15).toFixed(2);

  const variants: CatalogVariant[] = [7, 8, 9, 10].map((size, sIdx) => ({
    id: `var_${slug.replace(/-/g, "_")}_${size}`,
    product_id: prodId,
    is_master: sIdx === 1, // size 8 is master
    sku: `${raw.sku}-${size}`,
    in_stock: true,
    purchasable: true,
    track_inventory: true,
    price: {
      amount: amountStr,
      currency: "USD",
      display_amount: displayAmount,
      amount_in_cents: cents,
      compare_at_amount_in_cents: Math.round(cents * 1.15),
      display_compare_at_amount: displayCompareAmount,
    },
    original_price: {
      amount: amountStr,
      currency: "USD",
      display_amount: displayAmount,
      amount_in_cents: cents,
    },
    options_text: `Size: UK/India ${size}`,
    option_values: [
      {
        id: `opt_sz_${size}`,
        option_type_id: "ot_size",
        name: `${size}`,
        label: `UK/India ${size}`,
        presentation: `UK/India ${size}`,
        position: sIdx + 1,
        color_code: null,
        option_type_name: "size",
        option_type_label: "Size",
        image_url: null,
      },
    ],
  }));

  const primaryMedia: CatalogMedia = {
    id: `med_${slug.replace(/-/g, "_")}_1`,
    url: primaryUrl,
    alt: raw.name,
    position: 1,
    media_type: "image",
    original_url: originalUrl,
    large_url: primaryUrl,
    xlarge_url: originalUrl,
    small_url: thumbUrl,
    mini_url: thumbUrl,
    variant_ids: variants.map((v) => v.id),
  };

  return {
    id: prodId,
    name: raw.name,
    slug,
    sku: raw.sku,
    description: raw.desc,
    description_html: `<p>${raw.desc}</p>`,
    purchasable: true,
    in_stock: true,
    meta_title: `${raw.name} | Mirza Footwear`,
    meta_description: raw.desc,
    meta_keywords: `${raw.name}, handcrafted footwear, luxury leather`,
    thumbnail_url: thumbUrl,
    primary_media: primaryMedia,
    media: [primaryMedia],
    product_media: {
      mainUrl: primaryUrl,
      lqip: manifest?.lqip,
      dominantColor: manifest?.dominantColor || "#f5f5f5",
      variants: manifest?.variants,
    },
    price: {
      amount: amountStr,
      currency: "USD",
      display_amount: displayAmount,
      amount_in_cents: cents,
      compare_at_amount: compareStr,
      compare_at_amount_in_cents: Math.round(cents * 1.15),
      display_compare_at_amount: displayCompareAmount,
    },
    original_price: {
      amount: amountStr,
      currency: "USD",
      display_amount: displayAmount,
      amount_in_cents: cents,
    },
    categories: [category],
    default_variant_id: variants[1].id,
    default_variant: variants[1],
    variants,
    option_types: [
      {
        id: "ot_size",
        name: "size",
        label: "Size",
        presentation: "Size",
        position: 1,
        kind: "button",
      },
    ],
  };
}

export const PRODUCTS: CatalogProduct[] = [
  ...RAW_OFFICE_PRODUCTS.map((raw, i) =>
    buildCatalogProduct(raw, i, CATEGORIES[0]),
  ),
  ...RAW_TRADITIONAL_PRODUCTS.map((raw, i) =>
    buildCatalogProduct(raw, i + 19, CATEGORIES[1]),
  ),
];

export const MARKETS = [
  {
    id: "market_us",
    code: "us",
    name: "United States",
    default: true,
    default_country: { iso: "us", name: "United States" },
    default_locale: "en",
    supported_locales: ["en"],
    currencies: ["USD"],
    countries: [{ iso: "us", name: "United States" }],
  },
  {
    id: "market_in",
    code: "in",
    name: "India",
    default: false,
    default_country: { iso: "in", name: "India" },
    default_locale: "en",
    supported_locales: ["en"],
    currencies: ["INR"],
    countries: [{ iso: "in", name: "India" }],
  },
];

export const COUNTRIES = [
  {
    iso: "us",
    name: "United States",
    default_locale: "en",
    currency: "USD",
    states: [
      { id: "st_ny", abbr: "NY", name: "New York" },
      { id: "st_ca", abbr: "CA", name: "California" },
      { id: "st_tx", abbr: "TX", name: "Texas" },
    ],
  },
  {
    iso: "in",
    name: "India",
    default_locale: "en",
    currency: "INR",
    states: [
      { id: "st_mh", abbr: "MH", name: "Maharashtra" },
      { id: "st_dl", abbr: "DL", name: "Delhi" },
      { id: "st_ka", abbr: "KA", name: "Karnataka" },
      { id: "st_up", abbr: "UP", name: "Uttar Pradesh" },
    ],
  },
];

export const POLICIES = [
  {
    id: "pol_shipping",
    slug: "shipping-policy",
    title: "Shipping Policy",
    body: "Free insured white-glove express delivery across India and worldwide on all handcrafted footwear.",
  },
  {
    id: "pol_returns",
    slug: "return-policy",
    title: "Return & Exchange Policy",
    body: "30-day doorstep trial and size exchange for unworn footwear in original packaging.",
  },
];

// Query operations
export function queryProducts(params: {
  page?: number;
  limit?: number;
  offset?: number;
  q?: string;
  category_id?: string;
  in_category?: string;
  sort?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 12));

  let list = [...PRODUCTS];

  // Category filter
  const categoryFilter = params.in_category || params.category_id;
  if (categoryFilter) {
    const cleanCat = categoryFilter.toLowerCase();
    list = list.filter((p) =>
      p.categories.some(
        (c) =>
          c.id === cleanCat ||
          c.permalink === cleanCat ||
          c.permalink === `categories/${cleanCat}` ||
          c.name.toLowerCase() === cleanCat,
      ),
    );
  }

  // Search filter
  if (params.q && params.q.trim().length > 0) {
    const searchTerms = params.q.toLowerCase().trim().split(/\s+/);
    list = list.filter((p) => {
      const haystack = `${p.name} ${p.description} ${p.slug}`.toLowerCase();
      return searchTerms.every((term) => haystack.includes(term));
    });
  }

  // Sorting
  if (params.sort) {
    if (params.sort === "price_asc" || params.sort === "price") {
      list.sort((a, b) => a.price.amount_in_cents - b.price.amount_in_cents);
    } else if (params.sort === "price_desc" || params.sort === "-price") {
      list.sort((a, b) => b.price.amount_in_cents - a.price.amount_in_cents);
    } else if (params.sort === "name" || params.sort === "name_asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const totalCount = list.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex =
    params.offset != null
      ? Math.max(0, Number(params.offset))
      : (page - 1) * limit;
  const paginatedData = list.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    meta: {
      count: paginatedData.length,
      total_count: totalCount,
      page,
      pages: totalPages,
    },
  };
}

export function getProductBySlugOrId(slugOrId: string): CatalogProduct | null {
  const clean = slugOrId.toLowerCase().trim();
  return (
    PRODUCTS.find(
      (p) =>
        p.slug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.sku?.toLowerCase() === clean ||
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") === clean ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase() === clean ||
            v.id.toLowerCase() === clean ||
            v.sku.toLowerCase().endsWith(`-${clean}`),
        ),
    ) || null
  );
}

export function getCategoryByPermalinkOrId(
  permalinkOrId: string,
): CatalogCategory | null {
  const clean = permalinkOrId.toLowerCase().replace(/^categories\//, "");
  return (
    CATEGORIES.find(
      (c) =>
        c.id === permalinkOrId ||
        c.permalink.toLowerCase() === clean ||
        c.permalink.toLowerCase() === `categories/${clean}` ||
        c.name.toLowerCase() === clean,
    ) || null
  );
}

export function getCatalogFilters(params?: {
  in_category?: string;
  category_id?: string;
}) {
  const officeCount = PRODUCTS.filter((p) =>
    p.categories.some((c) => c.id === "7"),
  ).length;
  const traditionalCount = PRODUCTS.filter((p) =>
    p.categories.some((c) => c.id === "8"),
  ).length;

  const filters = [
    {
      id: "categories",
      label: "Category",
      name: "Category",
      type: "category",
      options: [
        {
          id: "7",
          name: "Office Wear",
          label: "Office Wear",
          count: officeCount,
          active:
            params?.category_id === "7" ||
            params?.in_category === "categories/office-wear" ||
            params?.in_category === "7",
        },
        {
          id: "8",
          name: "Traditional",
          label: "Traditional",
          count: traditionalCount,
          active:
            params?.category_id === "8" ||
            params?.in_category === "categories/traditional" ||
            params?.in_category === "8",
        },
      ],
    },
    {
      id: "size",
      label: "Size",
      name: "Size",
      type: "option",
      kind: "button",
      options: [
        { id: "opt_sz_7", name: "7", label: "UK/India 7", count: PRODUCTS.length },
        { id: "opt_sz_8", name: "8", label: "UK/India 8", count: PRODUCTS.length },
        { id: "opt_sz_9", name: "9", label: "UK/India 9", count: PRODUCTS.length },
        { id: "opt_sz_10", name: "10", label: "UK/India 10", count: PRODUCTS.length },
      ],
    },
    {
      id: "price",
      name: "Price Range",
      type: "price_range",
      min: 180,
      max: 340,
      currency: "USD",
    },
    {
      id: "availability",
      name: "Availability",
      type: "availability",
      options: [
        { id: "in_stock", name: "In Stock", count: PRODUCTS.length },
      ],
    },
  ];

  const sortOptions = [
    { id: "default", label: "Recommended" },
    { id: "price_asc", label: "Price: Low to High" },
    { id: "price_desc", label: "Price: High to Low" },
    { id: "newest", label: "Newest" },
  ];

  return {
    filters,
    sort_options: sortOptions,
    default_sort: "default",
    data: filters,
    meta: { count: filters.length },
  };
}

export function findCatalogVariantBySku(
  sku: string,
): { product: CatalogProduct; variant: CatalogVariant } | null {
  for (const p of PRODUCTS) {
    const v = p.variants.find((vItem) => vItem.sku === sku);
    if (v) return { product: p, variant: v };
  }
  return null;
}

export function findCatalogVariantByIdOrSku(
  idOrSku: string,
): { product: CatalogProduct; variant: CatalogVariant } | null {
  for (const p of PRODUCTS) {
    const v = p.variants.find(
      (vItem) => vItem.id === idOrSku || vItem.sku === idOrSku,
    );
    if (v) return { product: p, variant: v };
  }
  return null;
}
