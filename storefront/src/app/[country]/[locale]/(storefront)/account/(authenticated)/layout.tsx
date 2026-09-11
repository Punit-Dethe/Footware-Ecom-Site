import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthenticatedAccountShell } from "@/components/account/AuthenticatedAccountShell";
import { REQUEST_PATHNAME_HEADER, REQUEST_SEARCH_HEADER } from "@/i18n/routing";
import { getCustomer } from "@/lib/data/customer";
import { getAccessToken, getRefreshToken } from "@/lib/spree";
import {
  buildAccountLoginHref,
  resolveAccountRedirect,
} from "@/lib/utils/account-redirect";

interface AuthenticatedAccountLayoutProps {
  children: React.ReactNode;
  params: Promise<{ country: string; locale: string }>;
}

export default function AuthenticatedAccountLayout(
  props: AuthenticatedAccountLayoutProps,
) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedAccountLayoutContent {...props} />
    </Suspense>
  );
}

export async function AuthenticatedAccountLayoutContent({
  children,
  params,
}: AuthenticatedAccountLayoutProps) {
  const [{ country, locale }, requestHeaders, accessToken, refreshToken, customer] =
    await Promise.all([
      params,
      headers(),
      getAccessToken(),
      getRefreshToken(),
      getCustomer(),
    ]);

  const basePath = `/${country}/${locale}`;
  const pathname = requestHeaders.get(REQUEST_PATHNAME_HEADER);
  const search = requestHeaders.get(REQUEST_SEARCH_HEADER);
  const requestedPath = `${pathname ?? ""}${search?.startsWith("?") ? search : ""}`;
  const returnTo = resolveAccountRedirect(requestedPath, basePath);
  const loginHref = buildAccountLoginHref(basePath, returnTo);

  // Allow verified Supabase session or recoverable legacy credentials
  if (!accessToken && !refreshToken && !customer) redirect(loginHref);

  return (
    <AuthenticatedAccountShell loginHref={loginHref}>
      {children}
    </AuthenticatedAccountShell>
  );
}
