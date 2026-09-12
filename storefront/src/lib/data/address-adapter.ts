import type { Address } from "@spree/sdk";
import { COUNTRIES } from "@/lib/catalog/catalog-repository";
import type { AddressRow } from "@/lib/db/address";

/**
 * Adapts a PostgreSQL AddressRow into the Spree SDK Address compatibility shape
 * expected by existing account and checkout UI components without causing UI churn.
 */
export function adaptDbAddressToSpree(row: AddressRow): Address {
  const fullName = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const countryUpper = row.country_iso.toUpperCase();

  // Derive country display name: check local catalog countries first, then standard Intl
  let countryName = COUNTRIES.find(
    (c) => c.iso.toUpperCase() === countryUpper,
  )?.name;
  if (!countryName) {
    try {
      countryName =
        new Intl.DisplayNames(["en"], { type: "region" }).of(countryUpper) ||
        countryUpper;
    } catch {
      countryName = countryUpper;
    }
  }

  // Derive state abbreviation & display text
  const stateAbbr =
    row.state_abbr ||
    COUNTRIES.find((c) => c.iso.toUpperCase() === countryUpper)?.states?.find(
      (s) =>
        s.name.toLowerCase() === row.state.toLowerCase() ||
        s.abbr.toLowerCase() === row.state.toLowerCase(),
    )?.abbr ||
    row.state;

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: fullName,
    company: row.company || null,
    address1: row.address1,
    address2: row.address2 || null,
    city: row.city,
    postal_code: row.postal_code,
    phone: row.phone || null,
    country_iso: countryUpper,
    country_name: countryName,
    state_abbr: stateAbbr,
    state_name: row.state,
    state_text: stateAbbr || row.state,
    quick_checkout: false,
    is_default_shipping: row.is_default_shipping,
    is_default_billing: row.is_default_billing,
  } as unknown as Address;
}
