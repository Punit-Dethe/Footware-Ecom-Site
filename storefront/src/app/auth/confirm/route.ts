import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";

/**
 * Global authentication confirmation callback.
 * Handles Supabase email signup confirmation and password recovery links.
 * Verified tokens establish an authenticated session in the SSR cookie store.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Resolve country and locale context from existing cookies or defaults
  const country =
    request.cookies.get("spree_country")?.value || getDefaultCountry();
  const locale =
    request.cookies.get("spree_locale")?.value || getDefaultLocale();
  const canonicalPrefix = `/${country}/${locale}`;

  if (
    token_hash &&
    type &&
    (type === "email" || type === "recovery" || type === "signup")
  ) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type === "signup" ? "email" : type,
      });

      if (!error) {
        if (type === "recovery") {
          return NextResponse.redirect(
            new URL(`${canonicalPrefix}/account/reset-password`, request.url),
          );
        }

        return NextResponse.redirect(
          new URL(`${canonicalPrefix}/account`, request.url),
        );
      }
    } catch {
      // Intentionally fall through to generic error redirect
    }
  }

  // Safe redirect on verification failure — never leak raw token_hash or Supabase error
  return NextResponse.redirect(
    new URL(
      `${canonicalPrefix}/account?error=auth_confirmation_failed`,
      request.url,
    ),
  );
}
