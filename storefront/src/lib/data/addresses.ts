"use server";

import type { Address, AddressParams } from "@spree/sdk";
import { cookies } from "next/headers";
import {
  createAddress as dbCreateAddress,
  deleteAddress as dbDeleteAddress,
  getAddress as dbGetAddress,
  listAddresses as dbListAddresses,
  updateAddress as dbUpdateAddress,
} from "@/lib/db/address";
import { createClient } from "@/lib/supabase/server";
import { adaptDbAddressToSpree } from "./address-adapter";
import { actionResult } from "./utils";

/**
 * Extracts and cryptographically verifies the authenticated Supabase user ID.
 * Never trusts raw user cookies or client-supplied user_id.
 *
 * Rules:
 * - If no Supabase auth token cookie exists: fast-paths to null without network call
 *   (guaranteeing 0 remote auth calls on anonymous catalog pages). Supports chunked cookies.
 * - If Supabase returns a transient 500+ / fetch failure: fails closed (throws error).
 * - If unauthenticated and allowAnonymous is false: throws Error("Unauthorized").
 */
async function getVerifiedUserId(options?: {
  allowAnonymous?: boolean;
}): Promise<string | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"),
  );

  if (!hasAuthCookie) {
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    const name = error.name || "";
    if (
      (typeof status === "number" && status >= 500) ||
      name === "AuthRetryableFetchError" ||
      error.message?.includes("fetch failed")
    ) {
      // Fail closed on infrastructure outage
      throw error;
    }
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  if (!data?.claims?.sub || typeof data.claims.sub !== "string") {
    if (options?.allowAnonymous) {
      return null;
    }
    throw new Error("Unauthorized");
  }

  return data.claims.sub;
}

/**
 * Retrieve saved addresses for the authenticated customer.
 * Sourced strictly from PostgreSQL public.addresses.
 *
 * Rules:
 * - Anonymous / no auth cookie -> returns { data: [] } (0 remote auth calls)
 * - Normal invalid / expired session -> returns { data: [] }
 * - Authenticated user with no addresses -> returns { data: [] }
 * - Supabase auth outage (500+, fetch failure) -> throws / fails closed
 * - PostgreSQL failure -> throws / fails closed
 */
export async function getAddresses(): Promise<{ data: Address[] }> {
  const userId = await getVerifiedUserId({ allowAnonymous: true });
  if (!userId) {
    return { data: [] };
  }
  const rows = await dbListAddresses(userId);
  return { data: rows.map(adaptDbAddressToSpree) };
}

/**
 * Retrieve a specific saved address by ID, scoped strictly to the authenticated user.
 *
 * Rules:
 * - Anonymous / no auth cookie -> returns null (0 remote auth calls)
 * - Normal invalid / expired session -> returns null
 * - Foreign / nonexistent address -> returns null
 * - Supabase auth outage (500+, fetch failure) -> throws / fails closed
 * - PostgreSQL failure -> throws / fails closed
 */
export async function getAddress(id: string): Promise<Address | null> {
  const userId = await getVerifiedUserId({ allowAnonymous: true });
  if (!userId) {
    return null;
  }
  const row = await dbGetAddress(userId, id);
  return row ? adaptDbAddressToSpree(row) : null;
}

/**
 * Create a new saved address in PostgreSQL for the authenticated user.
 */
export async function createAddress(address: AddressParams) {
  return actionResult(async () => {
    const userId = await getVerifiedUserId({ allowAnonymous: false });
    if (!userId) throw new Error("Unauthorized");

    // Clean state mapping: prefer state_name, fallback to state_abbr
    const state =
      address.state_name?.trim() || address.state_abbr?.trim() || "";
    const stateAbbr = address.state_abbr?.trim() || null;

    const row = await dbCreateAddress(userId, {
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state,
      state_abbr: stateAbbr,
      postal_code: address.postal_code,
      country_iso: address.country_iso,
      phone: address.phone,
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
    });

    return { address: adaptDbAddressToSpree(row) };
  }, "Failed to create address");
}

/**
 * Update an existing saved address in PostgreSQL owned by the authenticated user.
 */
export async function updateAddress(
  id: string,
  address: Partial<AddressParams>,
) {
  return actionResult(async () => {
    const userId = await getVerifiedUserId({ allowAnonymous: false });
    if (!userId) throw new Error("Unauthorized");

    const state =
      address.state_name !== undefined || address.state_abbr !== undefined
        ? address.state_name?.trim() || address.state_abbr?.trim()
        : undefined;

    const row = await dbUpdateAddress(userId, id, {
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state,
      state_abbr: address.state_abbr,
      postal_code: address.postal_code,
      country_iso: address.country_iso,
      phone: address.phone,
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
    });

    return { address: adaptDbAddressToSpree(row) };
  }, "Failed to update address");
}

/**
 * Delete a saved address from PostgreSQL owned by the authenticated user.
 */
export async function deleteAddress(id: string) {
  return actionResult(async () => {
    const userId = await getVerifiedUserId({ allowAnonymous: false });
    if (!userId) throw new Error("Unauthorized");

    await dbDeleteAddress(userId, id);
    return {};
  }, "Failed to delete address");
}
