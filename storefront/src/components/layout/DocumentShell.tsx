import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, EB_Garamond, Geist } from "next/font/google";
import { localeDirection } from "@/i18n/locales";

const gtmId = process.env.GTM_ID;

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const editorialDisplay = Cormorant_Garamond({
  variable: "--font-editorial-display",
  subsets: ["latin"],
  display: "swap",
});

const editorialText = EB_Garamond({
  variable: "--font-editorial-text",
  subsets: ["latin"],
  display: "swap",
});

interface DocumentShellProps {
  children: React.ReactNode;
  locale: string;
}

/** Shared document markup for each root layout. */
export function DocumentShell({ children, locale }: DocumentShellProps) {
  return (
    <html lang={locale} dir={localeDirection(locale)} suppressHydrationWarning>
      <head />
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${geist.variable} ${editorialDisplay.variable} ${editorialText.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
