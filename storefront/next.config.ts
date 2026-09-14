import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import createNextIntlPlugin from "next-intl/plugin";
import { generateNextConfigCacheHeaders } from "./src/lib/cache/cache-policy";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const withNextIntl = createNextIntlPlugin();

/**
 * Tightly-scoped remote pattern for Supabase product-media storage images.
 * Scoped strictly to clean Supabase hostname and /storage/v1/object/public/product-media/**.
 */
function supabaseImagePatterns(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let hostname = "hkncfdsvgjopkujmmxem.supabase.co";
  let protocol: "http" | "https" = "https";
  if (raw) {
    try {
      const url = new URL(raw);
      hostname = url.hostname;
      protocol = url.protocol.replace(":", "") as "http" | "https";
    } catch {
      // Malformed URL — keep default clean host
    }
  }
  return [
    {
      protocol,
      hostname,
      pathname: "/storage/v1/object/public/product-media/**",
    },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["shop.lvh.me", "*.trycloudflare.com", "192.168.33.13"],
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN || "",
  },
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
    ],
  },
  turbopack: {
    root: __dirname,
  },
  cacheComponents: true,
  cacheLife: {
    tenMinutes: {
      stale: 300, // 5 minutes client stale window
      revalidate: 600, // 10 minutes until background revalidation
      expire: 3600, // 1 hour max before recompute on idle entries
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [25, 50, 65, 75, 85, 100],
    minimumCacheTTL: 2678400, // 31 days immutable edge caching for transformed images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Supabase Storage product-media bucket (admin-uploaded media)
      ...supabaseImagePatterns(),
      // NOTE: images.unsplash.com was removed — no product or editorial
      // asset uses it. Re-add only alongside a real usage site.
    ],
  },
  async redirects() {
    return [];
  },
  async headers() {
    return generateNextConfigCacheHeaders();
  },
};

const configWithIntl = withNextIntl(nextConfig);
const finalConfig = process.env.SENTRY_DSN
  ? withSentryConfig(configWithIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Automatically delete source maps after uploading to Sentry
      // so they are not served publicly
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      // Disables the Sentry SDK build-time telemetry
      telemetry: false,
    })
  : configWithIntl;

export default withBundleAnalyzer(finalConfig);
