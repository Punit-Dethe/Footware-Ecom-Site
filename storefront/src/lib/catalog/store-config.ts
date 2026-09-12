export interface StoreState {
  id: string;
  abbr: string;
  name: string;
}

export interface StoreCountry {
  iso: string;
  name: string;
  default_locale: string;
  currency: string;
  states?: StoreState[];
}

export interface StoreMarket {
  id: string;
  code: string;
  name: string;
  default: boolean;
  default_country: { iso: string; name: string };
  default_locale: string;
  supported_locales: string[];
  currencies: string[];
  countries: Array<{ iso: string; name: string }>;
}

export interface StorePolicy {
  id: string;
  slug: string;
  title: string;
  body: string;
}

export const MARKETS: StoreMarket[] = [
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

export const COUNTRIES: StoreCountry[] = [
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

export const POLICIES: StorePolicy[] = [
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
