import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthenticatedAccountShell } from "@/components/account/AuthenticatedAccountShell";
import { REQUEST_PATHNAME_HEADER, REQUEST_SEARCH_HEADER } from "@/i18n/routing";
import { getCustomer } from "@/lib/data/customer";
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
  const [{ country, locale }, requestHeaders] = await Promise.all([
    params,
    headers(),
  ]);

  const basePath = `/${country}/${locale}`;
  const pathname = requestHeaders.get(REQUEST_PATHNAME_HEADER);
  const search = requestHeaders.get(REQUEST_SEARCH_HEADER);
  const requestedPath = `${pathname ?? ""}${search?.startsWith("?") ? search : ""}`;
  const returnTo = resolveAccountRedirect(requestedPath, basePath);
  const loginHref = buildAccountLoginHref(basePath, returnTo);

  // If getCustomer() throws due to transient backend/DB outage while verified,
  // it bubbles to the error boundary rather than misreporting as anonymous.
  const customer = await getCustomer();

  // Strictly require verified Supabase identity; legacy Spree cookies cannot authorize
  if (!customer) redirect(loginHref);

  return (
    <AuthenticatedAccountShell loginHref={loginHref}>
      {children}
    </AuthenticatedAccountShell>
  );
}
