"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { ensureProfile, getProfile, updateProfile } from "@/lib/db/profile";
import {
  cacheTagSuffix,
  clearAllCartCookies,
  clearAuthCookies,
  SURFACES,
} from "@/lib/spree";
import { getStoreUrl } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { actionResult } from "./utils";

export interface AppUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: "customer" | "admin";
}

// Backward compatibility alias for UI consumers
export type Customer = AppUser;

/**
 * Get the currently authenticated customer from Supabase Auth and PostgreSQL public.profiles.
 * Sourced strictly via cryptographic claim verification (auth.getClaims()); never trusts raw cookies.
 *
 * Distinction:
 * - Anonymous user (no active claims) returns null.
 * - Verified user with transient backend/database failure throws an error so callers know
 *   this is a temporary outage rather than an anonymous user.
 */
export async function getCustomer(): Promise<AppUser | null> {
  const supabase = await createClient();
  let claimsData: { claims?: Record<string, unknown> } | null = null;

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return null;
    }
    claimsData = data as { claims: Record<string, unknown> };
  } catch {
    // If getting claims throws an auth/cookie read error, treat as anonymous
    return null;
  }

  const claims = claimsData.claims as Record<string, unknown>;
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  const email = typeof claims.email === "string" ? claims.email : "";

  if (!userId) return null;

  // Once identity is verified, profile/database failures must THROW
  // so transient outages are distinguished from anonymous users.
  let profile = await getProfile(userId);
  if (!profile) {
    // Idempotently heal missing profile record
    profile = await ensureProfile({
      id: userId,
      first_name:
        typeof claims.user_metadata === "object" && claims.user_metadata
          ? ((claims.user_metadata as Record<string, unknown>)
              .first_name as string) || null
          : null,
      last_name:
        typeof claims.user_metadata === "object" && claims.user_metadata
          ? ((claims.user_metadata as Record<string, unknown>)
              .last_name as string) || null
          : null,
      phone:
        typeof claims.user_metadata === "object" && claims.user_metadata
          ? ((claims.user_metadata as Record<string, unknown>)
              .phone as string) || null
          : null,
    });
  }

  return {
    id: userId,
    email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone,
    role: profile.role,
  };
}

/**
 * Reconcile the customer session on the client.
 * Returns stale: true when a verified session experiences a transient backend failure,
 * allowing the client to preserve existing session state without flashing logged-out.
 */
export async function syncSession(): Promise<{
  customer: AppUser | null;
  refreshed: boolean;
  stale?: boolean;
}> {
  try {
    const customer = await getCustomer();
    return { customer, refreshed: false, stale: false };
  } catch {
    // Session identity was verified but database / backend had a transient error
    return { customer: null, refreshed: false, stale: true };
  }
}

/**
 * Login with email and password via Supabase Auth.
 * Guest cart is preserved untouched across login (B3 owns persistent carts).
 */
export async function login(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  user?: AppUser;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Ensure profile row exists idempotently for verified user
    const profile = await ensureProfile({
      id: data.user.id,
      first_name:
        (data.user.user_metadata?.first_name as string | undefined) || null,
      last_name:
        (data.user.user_metadata?.last_name as string | undefined) || null,
      phone: (data.user.user_metadata?.phone as string | undefined) || null,
    });

    // Clean legacy Spree auth cookies defensively
    await clearAuthCookies();
    updateTag("customer");

    const appUser: AppUser = {
      id: data.user.id,
      email: data.user.email || email.trim(),
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      role: profile.role,
    };

    return {
      success: true,
      user: appUser,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Login failed",
    };
  }
}

/**
 * Register a new customer account via Supabase Auth.
 * Server-side validates password confirmation and password length.
 * Only accepts harmless user metadata.
 *
 * Rules:
 * - data.session exists (auto-confirmed) -> ensure verified profile, return user, requires_confirmation: false
 * - data.session is null (confirmation required or existing-user obfuscation) -> DO NOT ensure profile,
 *   DO NOT return user, return requires_confirmation: true.
 */
export async function register(params: {
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  user?: AppUser;
  requires_confirmation?: boolean;
  error?: string;
}> {
  if (params.password !== params.password_confirmation) {
    return {
      success: false,
      error: "Passwords do not match",
    };
  }

  if (!params.password || params.password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    };
  }

  // Filter for harmless metadata only — NEVER accept role, admin, or approval fields
  const safeData: Record<string, unknown> = {};
  if (params.first_name?.trim())
    safeData.first_name = params.first_name.trim();
  if (params.last_name?.trim())
    safeData.last_name = params.last_name.trim();
  if (params.phone?.trim()) safeData.phone = params.phone.trim();
  if (
    params.metadata?.company &&
    typeof params.metadata.company === "string"
  ) {
    safeData.company = params.metadata.company.trim();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: safeData,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Registration failed",
      };
    }

    // With email confirmation enabled (or on existing-user obfuscated response),
    // data.session is null. This is NOT an authenticated user.
    if (!data.session) {
      return {
        success: true,
        requires_confirmation: true,
      };
    }

    // data.session exists -> verified authenticated session
    const profile = await ensureProfile({
      id: data.user.id,
      first_name: params.first_name?.trim() || null,
      last_name: params.last_name?.trim() || null,
      phone: params.phone?.trim() || null,
    });

    await clearAuthCookies();
    updateTag("customer");

    return {
      success: true,
      requires_confirmation: false,
      user: {
        id: data.user.id,
        email: data.user.email || params.email.trim(),
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: profile.role,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Registration failed",
    };
  }
}

/**
 * Logout the current user from Supabase Auth.
 */
export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Non-fatal if session is already expired
  }

  // Clear legacy Spree cookies defensively
  await clearAuthCookies();

  // Clear every surface's cart on explicit user logout
  await clearAllCartCookies();
  updateTag("customer");
  for (const surface of SURFACES) {
    updateTag(`cart${cacheTagSuffix(surface)}`);
    updateTag(`checkout${cacheTagSuffix(surface)}`);
  }
  updateTag("addresses");
  updateTag("credit-cards");
}

/**
 * Resolve a trusted server-side redirect URL for password reset.
 * Rejects arbitrary external caller URLs (e.g. https://attacker.example/reset).
 */
async function resolveTrustedResetRedirect(
  context?: { country?: string; locale?: string } | string,
): Promise<string> {
  let country = "us";
  let locale = "en";

  if (typeof context === "object" && context !== null) {
    if (context.country && /^[a-z]{2}$/i.test(context.country)) {
      country = context.country.toLowerCase();
    }
    if (context.locale && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(context.locale)) {
      locale = context.locale.toLowerCase();
    }
  } else if (typeof context === "string") {
    // If a relative path or base path was passed (e.g. "/us/en/account/reset-password" or "/us/en")
    const match = context.match(/^\/([a-z]{2})\/([a-z]{2,3}(?:-[a-z0-9]{2,8})*)/i);
    if (match) {
      country = match[1].toLowerCase();
      locale = match[2].toLowerCase();
    }
  }

  // Derive origin strictly from trusted configuration or request context
  let origin = getStoreUrl();
  if (!origin) {
    try {
      const headerList = await headers();
      const host = headerList.get("x-forwarded-host") || headerList.get("host");
      const proto = headerList.get("x-forwarded-proto") || "https";
      if (host) {
        origin = `${proto}://${host}`;
      }
    } catch {
      // Outside active request context
    }
  }

  if (!origin) {
    origin = "http://localhost:3001";
  }

  return `${origin.replace(/\/+$/, "")}/${country}/${locale}/account/reset-password`;
}

/**
 * Request a password reset email via Supabase Auth.
 * Returns a generic success response regardless of whether the email exists.
 * Constructs the redirect URL on the server; never trusts caller-provided external origins.
 */
export async function requestPasswordReset(
  email: string,
  context?: { country?: string; locale?: string } | string,
): Promise<{ success: boolean; message: string }> {
  try {
    const redirectTo = await resolveTrustedResetRedirect(context);
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
  } catch {
    // Suppress error to avoid email enumeration
  }

  return {
    success: true,
    message: "If an account exists with that email, a reset link has been sent.",
  };
}

/**
 * Reset / update user password within an authenticated recovery session.
 * Requires a verified Supabase session (auth.getClaims()) before updating password.
 */
export async function resetPassword(
  password: string,
  passwordConfirmation: string,
): Promise<{ success: boolean; error?: string }> {
  if (password !== passwordConfirmation) {
    return {
      success: false,
      error: "Passwords do not match",
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters",
    };
  }

  try {
    const supabase = await createClient();

    // Verify session identity before allowing password mutation
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims) {
      return {
        success: false,
        error: "Unauthorized or expired password reset session",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Password reset failed",
      };
    }

    updateTag("customer");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Password reset failed",
    };
  }
}

/**
 * Update customer profile details.
 * Reauthenticates with current_password when updating email address.
 * Role remains strictly immutable.
 */
export async function updateCustomer(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  current_password?: string;
}) {
  return actionResult(async () => {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims) {
      throw new Error("Unauthorized");
    }

    const userId = claimsData.claims.sub as string;
    const currentEmail = (claimsData.claims.email as string) || "";
    const requestedEmail = data.email?.trim();
    const isEmailChanging = Boolean(requestedEmail && requestedEmail !== currentEmail);

    // If email is changing, reauthenticate with current_password before mutating anything
    if (isEmailChanging) {
      if (!data.current_password) {
        throw new Error("Current password is required to change email address");
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: data.current_password,
      });
      if (reauthError) {
        throw new Error("Invalid current password");
      }

      const { error: updateAuthError } = await supabase.auth.updateUser({
        email: requestedEmail,
      });
      if (updateAuthError) {
        throw new Error(updateAuthError.message);
      }
    }

    // Update profile names in PostgreSQL (role cannot be changed by customer)
    const updatedProfile = await updateProfile(userId, {
      first_name: data.first_name,
      last_name: data.last_name,
    });

    updateTag("customer");
    return {
      customer: {
        id: userId,
        // Authoritative email remains currentEmail until Supabase confirmation link is confirmed
        email: currentEmail,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
      },
    };
  }, "Failed to update customer");
}
