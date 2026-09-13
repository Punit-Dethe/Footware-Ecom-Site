import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { createStorefrontMiddleware } from "@/lib/storefront/middleware";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

export const proxy = createStorefrontMiddleware({
  defaultCountry: getDefaultCountry(),
  defaultLocale: getDefaultLocale(),
  supportedLocales: SUPPORTED_LOCALES,
});

export const config = {
  matcher: [
    "/((?!api/|admin|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
