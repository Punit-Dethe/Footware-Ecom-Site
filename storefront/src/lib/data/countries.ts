"use server";

import { cacheLife, cacheTag } from "next/cache";
import { COUNTRIES } from "@/lib/catalog/store-config";
import type { Country } from "@/types/commerce";

export async function getCountries(): Promise<{ data: Country[] }> {
  return { data: COUNTRIES as Country[] };
}

async function cachedGetCountry(iso: string): Promise<Country> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("country", `country-${iso}`);
  const found =
    COUNTRIES.find((c) => c.iso === iso.toLowerCase()) || COUNTRIES[0];
  return found as Country;
}

export async function getCountry(iso: string): Promise<Country> {
  return cachedGetCountry(iso);
}
