import "server-only";
import { query } from "./index";

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Retrieves a user's profile from PostgreSQL by Supabase user UUID.
 */
export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const res = await query<ProfileRow>(
    `SELECT id, first_name, last_name, phone, role, created_at, updated_at
     FROM public.profiles
     WHERE id = $1;`,
    [userId],
  );
  return res.rows[0] ?? null;
}

/**
 * Idempotently ensures that a profile row exists for a verified Supabase user.
 *
 * Notice:
 * - `role` is strictly omitted from the INSERT, allowing PostgreSQL to apply
 *   its default ('customer').
 * - `ON CONFLICT (id) DO UPDATE` ensures healing for genuine auth users without
 *   overriding an existing administrator role.
 */
export async function ensureProfile(user: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}): Promise<ProfileRow> {
  const res = await query<ProfileRow>(
    `INSERT INTO public.profiles (id, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
       last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
       phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
       updated_at = NOW()
     RETURNING id, first_name, last_name, phone, role, created_at, updated_at;`,
    [
      user.id,
      user.first_name?.trim() || null,
      user.last_name?.trim() || null,
      user.phone?.trim() || null,
    ],
  );

  return res.rows[0];
}

/**
 * Updates editable profile identity fields (first_name, last_name).
 * Role cannot be modified through this function.
 */
export async function updateProfile(
  userId: string,
  data: {
    first_name?: string | null;
    last_name?: string | null;
  },
): Promise<ProfileRow> {
  const res = await query<ProfileRow>(
    `UPDATE public.profiles
     SET
       first_name = COALESCE($2, first_name),
       last_name = COALESCE($3, last_name),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, first_name, last_name, phone, role, created_at, updated_at;`,
    [userId, data.first_name ?? null, data.last_name ?? null],
  );

  if (res.rows.length === 0) {
    throw new Error(`Profile not found for user: ${userId}`);
  }

  return res.rows[0];
}
