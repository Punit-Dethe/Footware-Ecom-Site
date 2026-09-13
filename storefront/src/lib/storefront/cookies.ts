import { cookies } from "next/headers";
import {
  CART_TOKEN_MAX_AGE,
  clearLegacyCartCookies,
  clearLegacyCartToken,
  MIRZA_CART_ID_COOKIE,
  MIRZA_CART_TOKEN_COOKIE,
  MIRZA_WHOLESALE_CART_ID_COOKIE,
  MIRZA_WHOLESALE_CART_TOKEN_COOKIE,
  resolveCartCookieState,
  resolveCartId,
  resolveCartToken,
  type ResolvedCartCookieState,
} from "./legacy-cookie-migration";
import {
  DEFAULT_SURFACE,
  SURFACES,
  type Surface,
} from "./surface";

/**
 * Whether the current execution context may write cookies. Next.js allows
 * cookie mutation only in Server Actions and Route Handlers, never during a
 * Server Component render. We probe with a harmless deletion of a throwaway
 * cookie: it succeeds in a writable context and throws otherwise.
 */
export async function canPersistCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_mirza_write_probe", "", { maxAge: -1, path: "/" });
    return true;
  } catch {
    return false;
  }
}

export function getCartCookieName(surface: Surface = DEFAULT_SURFACE): string {
  return surface === "wholesale"
    ? MIRZA_WHOLESALE_CART_TOKEN_COOKIE
    : MIRZA_CART_TOKEN_COOKIE;
}

export function getCartIdCookieName(surface: Surface = DEFAULT_SURFACE): string {
  return surface === "wholesale"
    ? MIRZA_WHOLESALE_CART_ID_COOKIE
    : MIRZA_CART_ID_COOKIE;
}

// --- Cart Cookies (token + ID always managed together) ---
//
// Cart cookies are surface-scoped: the DTC and wholesale carts live in separate
// cookie pairs so a customer can hold both at once. `surface` defaults to DTC.

export async function getCartCookieState(
  surface: Surface = DEFAULT_SURFACE,
): Promise<ResolvedCartCookieState> {
  const cookieStore = await cookies();
  return resolveCartCookieState(cookieStore, surface);
}

export async function getCartToken(
  surface: Surface = DEFAULT_SURFACE,
): Promise<string | undefined> {
  const cookieStore = await cookies();
  return resolveCartToken(cookieStore, surface);
}

export async function getCartId(
  surface: Surface = DEFAULT_SURFACE,
): Promise<string | undefined> {
  const cookieStore = await cookies();
  return resolveCartId(cookieStore, surface);
}

/**
 * Sets cart cookies for a surface.
 *
 * Invariant:
 * Writing new cart state makes the Mirza namespace authoritative.
 * - Always sets the new ID cookie.
 * - If token is provided, sets the new token cookie; if absent (authenticated cart),
 *   clears the new token cookie.
 * - Unconditionally expires the corresponding legacy ID and token cookies
 *   so stale legacy bearer tokens can never be resolved as fallback.
 */
export async function setCartCookies(
  id: string,
  token?: string,
  surface: Surface = DEFAULT_SURFACE,
): Promise<void> {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CART_TOKEN_MAX_AGE,
  };

  cookieStore.set(getCartIdCookieName(surface), id, opts);
  if (token) {
    cookieStore.set(getCartCookieName(surface), token, opts);
  } else {
    cookieStore.set(getCartCookieName(surface), "", { maxAge: -1, path: "/" });
  }

  // Idempotently and unconditionally expire legacy cookie pair (ID + token)
  clearLegacyCartCookies(cookieStore, surface);
}

export async function clearCartToken(
  surface: Surface = DEFAULT_SURFACE,
): Promise<void> {
  const cookieStore = await cookies();
  const opts = { maxAge: -1, path: "/" };
  cookieStore.set(getCartCookieName(surface), "", opts);
  clearLegacyCartToken(cookieStore, surface);
}

export async function clearCartCookies(
  surface: Surface = DEFAULT_SURFACE,
): Promise<void> {
  const cookieStore = await cookies();
  const opts = { maxAge: -1, path: "/" };
  cookieStore.set(getCartCookieName(surface), "", opts);
  cookieStore.set(getCartIdCookieName(surface), "", opts);
  clearLegacyCartCookies(cookieStore, surface);
}

/**
 * Clear the cart cookies for every surface. Used on logout / account deletion,
 * where leaving a wholesale cart cookie behind would leak it into the next
 * session.
 */
export async function clearAllCartCookies(): Promise<void> {
  await Promise.all(SURFACES.map((surface) => clearCartCookies(surface)));
}

// --- Cart ID (required) ---

export async function requireCartId(
  surface: Surface = DEFAULT_SURFACE,
): Promise<string> {
  const cartId = await getCartId(surface);
  // Reject a cookie that was cross-written with the other surface's cart id
  // (pre-channel-scoped-listing poisoning); fall through to re-resolve cleanly.
  if (cartId && !(await isPoisonedDtcCartId(cartId, surface))) {
    return cartId;
  }

  throw new Error("No cart found");
}

/**
 * Backstop for DTC cookies poisoned before channel-scoped listing existed: the
 * poison only ever flowed wholesale→DTC (the DTC list fallback adopted the
 * user's only cart, a wholesale one, into the DTC cookie). So on the DTC
 * surface, a cart-id cookie equal to the wholesale cookie's cart id is always
 * the poison and must be dropped. Directional on purpose — never drops the
 * wholesale surface's legitimate cart; the channel_id guard handles the
 * wholesale side. Single source of truth for this check — cart.ts and the
 * requireCartId path both import it rather than re-implementing it.
 */
export async function isPoisonedDtcCartId(
  cartId: string,
  surface: Surface,
): Promise<boolean> {
  if (surface !== "dtc") return false;
  const wholesaleCartId = await getCartId("wholesale");
  return Boolean(wholesaleCartId) && wholesaleCartId === cartId;
}
