/**
 * Store configuration flags
 */

/**
 * The wholesale channel code the B2B portal binds to, or `null` when the
 * wholesale portal is not enabled.
 */
export function getWholesaleChannelCode(): string | null {
  return process.env.SPREE_WHOLESALE_CHANNEL?.trim() || null;
}

/** Whether the wholesale portal addon is enabled for this storefront. */
export function isWholesaleEnabled(): boolean {
  return getWholesaleChannelCode() !== null;
}
