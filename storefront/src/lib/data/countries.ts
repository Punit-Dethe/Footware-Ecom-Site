"use server";

import type { Country } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { COUNTRIES } from "@/lib/catalog/catalog-repository";
import { getClient, getLocaleOptions } from "@/lib/spree";

export async function getCountries() {
  const options = await getLocaleOptions();
  try {
    return await getClient().countries.list(options);
  } catch (_error) {
    return { data: COUNTRIES as unknown as Country[] };
  }
}

async function cachedGetCountry(
  iso: string,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("country", `country-${iso}`);
  try {
    return await getClient().countries.get(iso, { expand: ["states"] }, options);
  } catch (_error) {
    const found =
      COUNTRIES.find((c) => c.iso === iso.toLowerCase()) || COUNTRIES[0];
    return found as unknown as Country;
  }
}

export async function getCountry(iso: string) {
  const options = await getLocaleOptions();
  return cachedGetCountry(iso, options);
}
