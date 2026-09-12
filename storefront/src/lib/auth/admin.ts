import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type ProfileRow } from "@/lib/db/profile";

export interface AdminIdentity {
  userId: string;
  email: string | null;
  profile: ProfileRow;
}

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "INFRASTRUCTURE_ERROR",
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Verifies that the current request belongs to an authenticated administrator.
 *
 * Authoritative flow:
 *   Supabase auth.getClaims()
 *   → claims.sub (verified user UUID)
 *   → public.profiles query
 *   → profile.role === 'admin'
 *
 * Never trusts:
 *   - client-supplied metadata or claims
 *   - client AuthContext role
 *   - cookies or headers other than verified session tokens
 *   - legacy Spree tokens
 *
 * Semantics:
 *   - Anonymous / expired / customer -> returns null
 *   - Auth service outage / DB outage -> THROWS / fails closed
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;
      const name = error.name || "";
      const msg = error.message || "";

      // Fail closed on infrastructure/network outages
      if (
        (typeof status === "number" && status >= 500) ||
        name === "AuthRetryableFetchError" ||
        msg.includes("fetch failed") ||
        msg.includes("ECONNREFUSED")
      ) {
        throw new AdminAuthError(
          `Auth service infrastructure outage: ${msg}`,
          "INFRASTRUCTURE_ERROR",
        );
      }

      // Normal unauthenticated or expired session
      return null;
    }

    const claims = data?.claims as Record<string, unknown> | undefined;
    if (!claims || typeof claims.sub !== "string" || !claims.sub) {
      return null;
    }

    const userId = claims.sub;
    const email = typeof claims.email === "string" ? claims.email : null;

    // Direct authoritative PostgreSQL profile lookup
    // If DB fails, getProfile() will throw, failing closed automatically.
    const profile = await getProfile(userId);
    if (!profile) {
      return null;
    }

    if (profile.role !== "admin") {
      return null;
    }

    return {
      userId,
      email,
      profile,
    };
  } catch (err) {
    if (err instanceof AdminAuthError) {
      throw err;
    }
    // Any unexpected exception (e.g. PostgreSQL network failure) must fail closed
    throw new AdminAuthError(
      `Admin authorization failed closed: ${err instanceof Error ? err.message : String(err)}`,
      "INFRASTRUCTURE_ERROR",
    );
  }
}

/**
 * Enforces admin authorization. Throws AdminAuthError if user is not an administrator.
 * Every Server Action and admin route must call this function directly.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) {
    throw new AdminAuthError("Admin authorization required.", "FORBIDDEN");
  }
  return identity;
}
