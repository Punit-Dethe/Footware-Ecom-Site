import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatZeroMoney,
  PriceResolutionError,
  resolveCountryCurrency,
  resolveVariantPrice,
} from "@/lib/data/pricing";
import { generatePriceBuckets } from "@/lib/utils/price-buckets";
import { adaptRawCatalogToPublicSnapshot } from "@/lib/catalog/catalog-repository";
import type { PublicCatalogRawData } from "@/lib/db/catalog";

describe("Multi-Currency & India INR Pricing Authority", () => {
  describe("pricing.ts helpers", () => {
    it("resolves country to correct currency code", () => {
      expect(resolveCountryCurrency("in")).toBe("INR");
      expect(resolveCountryCurrency("IN")).toBe("INR");
      expect(resolveCountryCurrency("us")).toBe("USD");
      expect(resolveCountryCurrency("US")).toBe("USD");
      expect(resolveCountryCurrency(undefined)).toBe("USD");
      expect(resolveCountryCurrency("unknown")).toBe("USD");
    });

    it("resolves variant price matching target currency or returns undefined", () => {
      const prices = [
        {
          id: "p-usd",
          variant_id: "v-1",
          currency: "USD",
          price_in_cents: 28500,
          compare_at_price_in_cents: 35000,
        },
      ];

      const usdPrice = resolveVariantPrice(prices, "USD");
      expect(usdPrice).toBeDefined();
      expect(usdPrice?.price_in_cents).toBe(28500);

      // Returns null if INR not present in price rows
      const inrPrice = resolveVariantPrice(prices, "INR");
      expect(inrPrice).toBeNull();

      // Throws PriceResolutionError for unsupported currency
      expect(() => resolveVariantPrice(prices, "EUR")).toThrow(PriceResolutionError);
    });

    it("formats money correctly for USD and INR without raw string hacks", () => {
      // USD standard cents
      expect(formatMoney(28500, "USD")).toBe("$285.00");
      expect(formatMoney(0, "USD")).toBe("$0.00");
      expect(formatZeroMoney("USD")).toBe("$0.00");

      // INR paise: 2508000 paise = ₹25,080
      const formattedInr = formatMoney(2508000, "INR");
      expect(formattedInr).toContain("25,080");
      expect(formattedInr).toContain("₹");

      // Zero INR
      const zeroInr = formatZeroMoney("INR");
      expect(zeroInr).toContain("₹");
      expect(zeroInr).toContain("0");
    });
  });

  describe("price-buckets.ts", () => {
    it("returns INR price buckets with ₹ symbols and INR thresholds", () => {
      const inrBuckets = generatePriceBuckets(0, 50000, "INR");
      expect(inrBuckets.length).toBeGreaterThan(0);
      expect(inrBuckets[0].id).toBe("under-10000");
      expect(inrBuckets[0].label).toContain("₹");
      expect(inrBuckets[0].label).toContain("10,000");
    });

    it("returns USD price buckets with $ symbols and USD thresholds", () => {
      const usdBuckets = generatePriceBuckets(0, 500, "USD");
      expect(usdBuckets.length).toBeGreaterThan(0);
      expect(usdBuckets[0].id).toBe("under-50");
      expect(usdBuckets[0].label).toContain("$50");
    });
  });

  describe("catalog adaptation currency isolation", () => {
    const rawData: PublicCatalogRawData = {
      products: [
        {
          id: "prod-1",
          name: "The Sovereign Wholecut Oxford",
          slug: "sovereign-wholecut-oxford",
          sku: "SOV-001",
          description: "Premium handcrafted leather shoes",
          description_html: "<p>Premium handcrafted leather shoes</p>",
          status: "active",
          meta_title: null,
          meta_description: null,
          meta_keywords: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      categories: [
        {
          id: "cat-1",
          name: "Oxfords",
          slug: "oxfords",
          description: null,
          parent_id: null,
          position: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      variants: [
        {
          id: "var-1",
          product_id: "prod-1",
          sku: "SOV-001-9",
          size_option: "9",
          price_in_cents: 28500,
          compare_at_price_in_cents: null,
          currency: "USD",
          quantity_on_hand: 5,
          backorderable: false,
          position: 1,
          is_default: true,
          active: true,
        },
      ],
      productCategories: [
        {
          product_id: "prod-1",
          category_id: "cat-1",
        },
      ],
      variantPrices: [
        {
          id: "vp-1-usd",
          variant_id: "var-1",
          currency: "USD",
          price_in_cents: 28500,
          compare_at_price_in_cents: 35000,
        },
        {
          id: "vp-1-inr",
          variant_id: "var-1",
          currency: "INR",
          price_in_cents: 2508000,
          compare_at_price_in_cents: 3080000,
        },
      ],
    };

    it("adapts public catalog with authoritative USD prices", () => {
      const snapshot = adaptRawCatalogToPublicSnapshot(rawData, "USD");
      const product = snapshot.products[0];
      const variant = product.variants[0];

      expect(product.price.currency).toBe("USD");
      expect(product.price.amount_in_cents).toBe(28500);
      expect(product.price.display_amount).toBe("$285.00");
      expect(variant.price.currency).toBe("USD");
      expect(variant.price.display_amount).toBe("$285.00");
      expect(variant.purchasable).toBe(true);
      expect(variant.in_stock).toBe(true);
    });

    it("adapts public catalog with authoritative INR prices", () => {
      const snapshot = adaptRawCatalogToPublicSnapshot(rawData, "INR");
      const product = snapshot.products[0];
      const variant = product.variants[0];

      expect(product.price.currency).toBe("INR");
      expect(product.price.amount_in_cents).toBe(2508000);
      expect(product.price.display_amount).toContain("25,080");
      expect(product.price.display_amount).toContain("₹");
      expect(variant.price.currency).toBe("INR");
      expect(variant.price.display_amount).toContain("25,080");
      expect(variant.purchasable).toBe(true);
      expect(variant.in_stock).toBe(true);
    });

    it("fails closed when requested currency has no configured price row", () => {
      // Data with only USD price row
      const usdOnlyRawData: PublicCatalogRawData = {
        ...rawData,
        variantPrices: [
          {
            id: "vp-1-usd",
            variant_id: "var-1",
            currency: "USD",
            price_in_cents: 28500,
            compare_at_price_in_cents: 35000,
          },
        ],
      };

      const snapshot = adaptRawCatalogToPublicSnapshot(usdOnlyRawData, "INR");
      const product = snapshot.products[0];
      const variant = product.variants[0];

      expect(variant.purchasable).toBe(false);
      expect(variant.in_stock).toBe(false);
      expect(variant.price.amount_in_cents).toBe(0);
      expect(product.purchasable).toBe(false);
      expect(product.in_stock).toBe(false);
    });
  });
});
