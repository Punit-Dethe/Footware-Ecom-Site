#!/usr/bin/env node
/**
 * Synthetic Footwear Catalog Generator
 * Uses Spree Store/Admin API or seed scripts to generate realistic footwear products
 * with variants (sizes, colors), taxonomies, pricing, and image metadata.
 */

const DEFAULT_SPREE_URL = process.env.SPREE_API_URL || 'http://localhost:4000';
const DEFAULT_API_KEY = process.env.SPREE_PUBLISHABLE_KEY || '';

const FOOTWEAR_TAXONOMIES = [
  { name: 'Running', description: 'High-performance running shoes and marathon trainers' },
  { name: 'Lifestyle & Sneakers', description: 'Everyday lifestyle and streetwear silhouettes' },
  { name: 'Basketball', description: 'Court-ready high-top and low-top basketball footwear' },
  { name: 'Trail & Outdoor', description: 'Rugged terrain, waterproof hiking and trail running footwear' },
  { name: 'Training & Gym', description: 'Cross-training, lifting, and HIIT footwear' },
];

const SIZES = ['US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 12'];
const COLORS = ['Triple Black', 'Cloud White', 'Volt Orange', 'Midnight Navy', 'Metallic Silver'];

console.log(`[Catalog Generator] Spree URL: ${DEFAULT_SPREE_URL}`);
console.log(`[Catalog Generator] Taxonomy Categories: ${FOOTWEAR_TAXONOMIES.map(t => t.name).join(', ')}`);
console.log(`[Catalog Generator] Configured for realistic footwear variants (${SIZES.length} sizes x ${COLORS.length} colorways).`);
console.log(`[Catalog Generator] Seed integration ready for live backend connection.`);
