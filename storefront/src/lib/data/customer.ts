"use server";

import { updateTag } from "next/cache";
import { ensureProfile, getProfile, updateProfile } from "@/lib/db/profile";
import {
  cacheTagSuffix,
  clearAllCartCookies,
  clearAuthCookies,
  SURFACES,
} from "@/lib/spree";
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
 */
export async function getCustomer(): Promise<AppUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return null;
    }

    const claims = data.claims as Record<string, unknown>;
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    const email = typeof claims.email === "string" ? claims.email : "";

    if (!userId) return null;

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
  } catch {
    return null;
  }
}

/**
 * Reconcile the customer session on the client.
 */
export async function syncSession(): Promise<{
  customer: AppUser | null;
  refreshed: boolean;
  stale?: boolean;
}> {
  try {
    const customer = await getCustomer();
    return { customer, refreshed: false };
  } catch {
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

    return { success: true, user: appUser };
  } catch {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }
}

/**
 * Register a new customer account via Supabase Auth.
 * Server-side validates password confirmation and password length.
 * Only accepts harmless user metadata.
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

    // If an active session was returned (e.g. email confirmation off/auto-confirm), ensure profile
    let role: "customer" | "admin" = "customer";
    if (data.session) {
      const profile = await ensureProfile({
        id: data.user.id,
        first_name: params.first_name?.trim() || null,
        last_name: params.last_name?.trim() || null,
        phone: params.phone?.trim() || null,
      });
      role = profile.role;
    }

    await clearAuthCookies();
    updateTag("customer");

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || params.email.trim(),
        first_name: params.first_name || null,
        last_name: params.last_name || null,
        phone: params.phone || null,
        role,
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
 * Request a password reset email via Supabase Auth.
 * Returns a generic success response regardless of whether the email exists.
 */
export async function requestPasswordReset(
  email: string,
  redirectUrl?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
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
 */
export async function resetPassword(
  tokenOrUnused: string,
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

    // Update profile names in PostgreSQL
    const updatedProfile = await updateProfile(userId, {
      first_name: data.first_name,
      last_name: data.last_name,
    });

    // Update email via Supabase Auth if provided and changed
    if (data.email && data.email.trim() !== claimsData.claims.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: data.email.trim(),
      });
      if (emailError) {
        throw new Error(emailError.message);
      }
    }

    updateTag("customer");
    return {
      customer: {
        id: userId,
        email: data.email?.trim() || (claimsData.claims.email as string),
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
      },
    };
  }, "Update failed");
}
