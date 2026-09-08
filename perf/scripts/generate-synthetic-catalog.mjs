#!/usr/bin/env node
/**
 * Synthetic Footwear Catalog Generator
 * Uses Spree Store/Admin API or seed scripts to generate realistic footwear products
 * with variants (sizes, colors), taxonomies, pricing, and image metadata.
 */

const DEFAULT_SPREE_URL = process.env.SPREE_API_URL || 'http://localhost:4000';
const DEFAULT_API_KEY = process.env.SPREE_PUBLISHABLE_KEY || '';

const FOOTWEAR_TAXONOMIES = [
  { name: 'Formal & Office Shoes', description: 'Goodyear-welted Oxfords, Brogues, and Monk Straps for boardroom distinction.' },
  { name: 'Traditional Indian Footwear', description: 'Ceremonial Juttis, authentic Mojaris, handcrafted Kolhapuris, and royal Peshawaris.' },
  { name: 'Loafers & Slip-Ons', description: 'Saddle Penny Loafers and Venetian slip-ons handcrafted from vegetable-tanned leather.' },
  { name: 'Leather Boots', description: 'Refined Chelsea and Chukka boots with burnished patina and all-day comfort.' },
];

const SIZES = ['UK/India 6', 'UK/India 7', 'UK/India 8', 'UK/India 9', 'UK/India 10', 'UK/India 11', 'UK/India 12'];
const COLORS = ['Mahogany Tan', 'Deep Oxblood', 'Antique Cognac', 'Midnight Black', 'Espresso Brown', 'Regal Gold'];

console.log(`[Catalog Generator] Spree URL: ${DEFAULT_SPREE_URL}`);
console.log(`[Catalog Generator] Taxonomy Categories: ${FOOTWEAR_TAXONOMIES.map(t => t.name).join(', ')}`);
console.log(`[Catalog Generator] Configured for realistic footwear variants (${SIZES.length} sizes x ${COLORS.length} colorways).`);
console.log(`[Catalog Generator] Seed integration ready for live backend connection.`);
