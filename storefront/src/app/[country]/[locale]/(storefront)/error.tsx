"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const segments = (pathname || "").split("/").filter(Boolean);
  const country = segments[0] || "us";
  const locale = segments[1] || "en";
  const basePath = `/${country}/${locale}`;

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 sm:py-32 flex flex-col items-center justify-center text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Temporarily Unavailable
        </h1>
        <p className="mt-4 text-base text-gray-600 leading-relaxed">
          We encountered an issue loading this section of the store. Please try again or return to the catalog.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button onClick={reset} variant="default" size="lg">
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`${basePath}/products`}>Browse Catalog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
