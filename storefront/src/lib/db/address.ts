import "server-only";
import { query } from "./index";

export interface AddressRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  state_abbr: string | null;
  postal_code: string;
  country_iso: string;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AddressCreateInput {
  first_name: string;
  last_name: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  state_abbr?: string | null;
  postal_code: string;
  country_iso: string;
  phone?: string | null;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface AddressUpdateInput {
  first_name?: string;
  last_name?: string;
  company?: string | null;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  state_abbr?: string | null;
  postal_code?: string;
  country_iso?: string;
  phone?: string | null;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

/**
 * List all saved addresses for the authenticated user.
 * Strictly bound to user_id in SQL.
 */
export async function listAddresses(userId: string): Promise<AddressRow[]> {
  if (!userId) {
    throw new Error("User ID is required to list addresses");
  }

  const res = await query<AddressRow>(
    `SELECT id, user_id, first_name, last_name, company, address1, address2,
            city, state, state_abbr, postal_code, country_iso, phone,
            is_default_shipping, is_default_billing, created_at, updated_at
     FROM public.addresses
     WHERE user_id = $1
     ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at DESC;`,
    [userId],
  );

  return res.rows;
}

/**
 * Get a specific address owned by the authenticated user.
 * Strictly bound to user_id in SQL; an address UUID alone is never authorization.
 */
export async function getAddress(
  userId: string,
  addressId: string,
): Promise<AddressRow | null> {
  if (!userId || !addressId) {
    return null;
  }

  const res = await query<AddressRow>(
    `SELECT id, user_id, first_name, last_name, company, address1, address2,
            city, state, state_abbr, postal_code, country_iso, phone,
            is_default_shipping, is_default_billing, created_at, updated_at
     FROM public.addresses
     WHERE id = $2 AND user_id = $1;`,
    [userId, addressId],
  );

  return res.rows[0] ?? null;
}

/**
 * Create a new address for the authenticated user.
 * user_id is strictly bound to the verified caller; client-supplied user_id is ignored.
 */
export async function createAddress(
  userId: string,
  input: AddressCreateInput,
): Promise<AddressRow> {
  if (!userId) {
    throw new Error("User ID is required to create an address");
  }

  const firstName = input.first_name?.trim();
  const lastName = input.last_name?.trim();
  const address1 = input.address1?.trim();
  const city = input.city?.trim();
  const state = input.state?.trim();
  const postalCode = input.postal_code?.trim();
  const countryIso = input.country_iso?.trim().toUpperCase();

  if (!firstName) throw new Error("First name is required");
  if (!lastName) throw new Error("Last name is required");
  if (!address1) throw new Error("Street address is required");
  if (!city) throw new Error("City is required");
  if (!state) throw new Error("State is required");
  if (!postalCode) throw new Error("Postal code is required");
  if (countryIso?.length !== 2) {
    throw new Error("Valid 2-character country ISO code is required");
  }

  const res = await query<AddressRow>(
    `INSERT INTO public.addresses (
       user_id, first_name, last_name, company, address1, address2,
       city, state, state_abbr, postal_code, country_iso, phone,
       is_default_shipping, is_default_billing
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11, $12,
       $13, $14
     )
     RETURNING id, user_id, first_name, last_name, company, address1, address2,
               city, state, state_abbr, postal_code, country_iso, phone,
               is_default_shipping, is_default_billing, created_at, updated_at;`,
    [
      userId,
      firstName,
      lastName,
      input.company?.trim() || null,
      address1,
      input.address2?.trim() || null,
      city,
      state,
      input.state_abbr?.trim().toUpperCase() || null,
      postalCode,
      countryIso,
      input.phone?.trim() || null,
      Boolean(input.is_default_shipping),
      Boolean(input.is_default_billing),
    ],
  );

  return res.rows[0];
}

/**
 * Update an existing address owned by the authenticated user.
 * Strictly bound to user_id in SQL; fails if addressId does not belong to userId.
 * Prohibits mutation of id, user_id, and created_at.
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressUpdateInput,
): Promise<AddressRow> {
  if (!userId || !addressId) {
    throw new Error("User ID and Address ID are required to update an address");
  }

  const setClauses: string[] = [];
  const values: unknown[] = [addressId, userId];
  let paramIdx = 3;

  if (input.first_name !== undefined) {
    const val = input.first_name.trim();
    if (!val) throw new Error("First name cannot be empty");
    setClauses.push(`first_name = $${paramIdx++}`);
    values.push(val);
  }

  if (input.last_name !== undefined) {
    const val = input.last_name.trim();
    if (!val) throw new Error("Last name cannot be empty");
    setClauses.push(`last_name = $${paramIdx++}`);
    values.push(val);
  }

  if (input.company !== undefined) {
    setClauses.push(`company = $${paramIdx++}`);
    values.push(input.company?.trim() || null);
  }

  if (input.address1 !== undefined) {
    const val = input.address1.trim();
    if (!val) throw new Error("Street address cannot be empty");
    setClauses.push(`address1 = $${paramIdx++}`);
    values.push(val);
  }

  if (input.address2 !== undefined) {
    setClauses.push(`address2 = $${paramIdx++}`);
    values.push(input.address2?.trim() || null);
  }

  if (input.city !== undefined) {
    const val = input.city.trim();
    if (!val) throw new Error("City cannot be empty");
    setClauses.push(`city = $${paramIdx++}`);
    values.push(val);
  }

  if (input.state !== undefined) {
    const val = input.state.trim();
    if (!val) throw new Error("State cannot be empty");
    setClauses.push(`state = $${paramIdx++}`);
    values.push(val);
  }

  if (input.state_abbr !== undefined) {
    setClauses.push(`state_abbr = $${paramIdx++}`);
    values.push(input.state_abbr?.trim().toUpperCase() || null);
  }

  if (input.postal_code !== undefined) {
    const val = input.postal_code.trim();
    if (!val) throw new Error("Postal code cannot be empty");
    setClauses.push(`postal_code = $${paramIdx++}`);
    values.push(val);
  }

  if (input.country_iso !== undefined) {
    const val = input.country_iso.trim().toUpperCase();
    if (val?.length !== 2) {
      throw new Error("Valid 2-character country ISO code is required");
    }
    setClauses.push(`country_iso = $${paramIdx++}`);
    values.push(val);
  }

  if (input.phone !== undefined) {
    setClauses.push(`phone = $${paramIdx++}`);
    values.push(input.phone?.trim() || null);
  }

  if (input.is_default_shipping !== undefined) {
    setClauses.push(`is_default_shipping = $${paramIdx++}`);
    values.push(Boolean(input.is_default_shipping));
  }

  if (input.is_default_billing !== undefined) {
    setClauses.push(`is_default_billing = $${paramIdx++}`);
    values.push(Boolean(input.is_default_billing));
  }

  if (setClauses.length === 0) {
    const existing = await getAddress(userId, addressId);
    if (!existing) {
      throw new Error("Address not found or permission denied");
    }
    return existing;
  }

  setClauses.push(`updated_at = NOW()`);

  const sql = `
    UPDATE public.addresses
    SET ${setClauses.join(", ")}
    WHERE id = $1 AND user_id = $2
    RETURNING id, user_id, first_name, last_name, company, address1, address2,
              city, state, state_abbr, postal_code, country_iso, phone,
              is_default_shipping, is_default_billing, created_at, updated_at;
  `;

  const res = await query<AddressRow>(sql, values);

  if (res.rows.length === 0) {
    throw new Error("Address not found or permission denied");
  }

  return res.rows[0];
}

/**
 * Delete an address owned by the authenticated user.
 * Strictly bound to user_id in SQL; fails if addressId does not belong to userId.
 */
export async function deleteAddress(
  userId: string,
  addressId: string,
): Promise<boolean> {
  if (!userId || !addressId) {
    throw new Error("User ID and Address ID are required to delete an address");
  }

  const res = await query<{ id: string }>(
    `DELETE FROM public.addresses
     WHERE id = $2 AND user_id = $1
     RETURNING id;`,
    [userId, addressId],
  );

  if (res.rowCount === 0) {
    throw new Error("Address not found or permission denied");
  }

  return true;
}
