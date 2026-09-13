"use server";

import { getVerifiedUserId } from "./customer";

/**
 * Whether the current request has an authenticated customer session.
 * Verified strictly via cryptographic claims (auth.getClaims()); never trusts raw cookies.
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getVerifiedUserId();
  return Boolean(userId);
}
