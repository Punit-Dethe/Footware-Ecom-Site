"use server";

import { COUNTRIES } from "@/lib/catalog/store-config";
import type { Country } from "@/types/commerce";

export async function getCountries(): Promise<{ data: Country[] }> {
  return { data: COUNTRIES as Country[] };
}

export async function getCountry(iso: string): Promise<Country> {
  const found =
    COUNTRIES.find((c) => c.iso === iso.toLowerCase()) || COUNTRIES[0];
  return found as Country;
}

export const cachedGetCountry = getCountry;

