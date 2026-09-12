"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteSync } from "@/components/auth/AuthRouteSync";
import { AccountShell } from "./AccountShell";

function SessionFallback() {
  const t = useTranslations("common");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-md space-y-4 animate-pulse motion-reduce:animate-none">
        <span className="sr-only">{t("loading")}</span>
        <div
          aria-hidden="true"
          className="h-8 w-1/2 mx-auto rounded bg-gray-200"
        />
        <div
          aria-hidden="true"
          className="h-4 w-3/4 mx-auto rounded bg-gray-200"
        />
        <div aria-hidden="true" className="h-32 rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface AuthenticatedAccountShellProps {
  children: React.ReactNode;
  loginHref: string;
}

/**
 * The server layout rejects requests with no session credentials. This client
 * boundary verifies the remaining session before exposing account chrome and
 * prevents false anonymous redirects during client SPA navigation from catalog routes.
 * Relies on the parent AuthRouteSync as the sole owner of route-entry session synchronization.
 */
export function AuthenticatedAccountShell({
  children,
  loginHref,
}: AuthenticatedAccountShellProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { isSyncing } = useRouteSync();

  useEffect(() => {
    if (!loading && !isSyncing && !isAuthenticated) {
      router.replace(loginHref);
    }
  }, [isAuthenticated, loading, isSyncing, loginHref, router]);

  if (loading || isSyncing || !isAuthenticated) return <SessionFallback />;

  return <AccountShell>{children}</AccountShell>;
}
