import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./server";

export interface ProxyAuthResult {
  userId: string | null;
  email: string | null;
  claims: Record<string, unknown> | null;
  cookiesRefreshed: boolean;
}

/**
 * Creates a Supabase client configured for Next.js proxy/middleware execution.
 * Synchronizes refreshed session cookies across both request and response objects.
 */
export function createProxySupabaseClient(
  request: NextRequest,
  response: NextResponse,
  onCookiesSet?: () => void,
) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        if (cookiesToSet.length > 0 && onCookiesSet) {
          onCookiesSet();
        }
      },
    },
  });
}

/**
 * Verifies the Supabase session in proxy/middleware using cryptographic claim verification.
 * Does NOT trust raw cookie presence alone.
 */
export async function verifyProxySession(
  request: NextRequest,
  response: NextResponse,
): Promise<ProxyAuthResult> {
  let cookiesRefreshed = false;
  const supabase = createProxySupabaseClient(request, response, () => {
    cookiesRefreshed = true;
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return {
        userId: null,
        email: null,
        claims: null,
        cookiesRefreshed,
      };
    }

    const claims = data.claims as Record<string, unknown>;
    const userId = typeof claims.sub === "string" ? claims.sub : null;
    const email = typeof claims.email === "string" ? claims.email : null;

    return {
      userId,
      email,
      claims,
      cookiesRefreshed,
    };
  } catch {
    return {
      userId: null,
      email: null,
      claims: null,
      cookiesRefreshed,
    };
  }
}
