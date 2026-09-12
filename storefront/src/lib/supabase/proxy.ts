import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./server";

export interface ProxyAuthResult {
  userId: string | null;
  email: string | null;
  claims: Record<string, unknown> | null;
  cookiesRefreshed: boolean;
  response: NextResponse;
  transientFailure?: boolean;
}

export interface ProxyClientHandle {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
  getCookiesRefreshed: () => boolean;
}

/**
 * Creates a Supabase client configured for Next.js proxy/middleware execution.
 * Follows the official @supabase/ssr Next.js pattern:
 * When setAll() is called:
 * 1. updates request.cookies so downstream Server Components in the same request see current tokens
 * 2. rebuilds NextResponse.next({ request }) with the updated request headers
 * 3. sets the rotated cookies on that response for the browser
 */
export function createProxySupabaseClient(
  request: NextRequest,
  onCookiesSet?: () => void,
): ProxyClientHandle {
  let cookiesRefreshed = false;
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesRefreshed = true;
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({
          request,
        });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
        if (cookiesToSet.length > 0 && onCookiesSet) {
          onCookiesSet();
        }
      },
    },
  });

  return {
    supabase,
    getResponse: () => supabaseResponse,
    getCookiesRefreshed: () => cookiesRefreshed,
  };
}

/**
 * Verifies the Supabase session in proxy/middleware using cryptographic claim verification.
 * Owns and returns the NextResponse carrying rotated request & response cookies.
 * Does NOT treat transient network/service outages as anonymous.
 */
export async function verifyProxySession(
  request: NextRequest,
): Promise<ProxyAuthResult> {
  const { supabase, getResponse, getCookiesRefreshed } =
    createProxySupabaseClient(request);

  try {
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
        return {
          userId: null,
          email: null,
          claims: null,
          cookiesRefreshed: getCookiesRefreshed(),
          response: getResponse(),
          transientFailure: true,
        };
      }
      return {
        userId: null,
        email: null,
        claims: null,
        cookiesRefreshed: getCookiesRefreshed(),
        response: getResponse(),
      };
    }

    if (!data?.claims) {
      return {
        userId: null,
        email: null,
        claims: null,
        cookiesRefreshed: getCookiesRefreshed(),
        response: getResponse(),
      };
    }

    const claims = data.claims as Record<string, unknown>;
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    const email = typeof claims.email === "string" ? claims.email : null;

    return {
      userId,
      email,
      claims,
      cookiesRefreshed: getCookiesRefreshed(),
      response: getResponse(),
    };
  } catch (_err) {
    // Unexpected transport/network exception thrown during claims retrieval
    return {
      userId: null,
      email: null,
      claims: null,
      cookiesRefreshed: getCookiesRefreshed(),
      response: getResponse(),
      transientFailure: true,
    };
  }
}
