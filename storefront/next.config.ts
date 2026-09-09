import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import createNextIntlPlugin from "next-intl/plugin";
import { generateNextConfigCacheHeaders } from "./src/lib/cache/cache-policy";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/**
 * Allow product/asset images served by the configured Spree backend. Spree
 * returns Active Storage URLs on its own host (which may differ from
 * SPREE_API_URL's — e.g. store URL vs API URL, http vs https, with or without a
 * port), so we allow the SPREE_API_URL hostname over both protocols and any
 * port rather than hardcoding specific hosts. Set SPREE_IMAGES_URL when images
 * are served from a different host than the API — e.g. spree.sh puts images
 * behind a CDN (console.spree.sh) — and it takes precedence over SPREE_API_URL.
 * The pathname stays scoped to Active Storage. Falls back to `localhost` when
 * neither variable is set (dev).
 */
function spreeImagePatterns(): RemotePattern[] {
  const raw = (
    process.env.SPREE_IMAGES_URL || process.env.SPREE_API_URL
  )?.trim();
  let hostname = "localhost";
  if (raw) {
    try {
      hostname = new URL(raw).hostname;
    } catch {
      // Malformed URL — keep the localhost fallback.
    }
  }
  const pathname = "/rails/active_storage/**";
  return [
    { protocol: "http", hostname, pathname },
    { protocol: "https", hostname, pathname },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["shop.lvh.me", "*.trycloudflare.com", "192.168.33.13"],
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN || "",
  },
  transpilePackages: ["@spree/sdk"],
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
    dangerouslyAllowLocalIP: true, // Allow localhost images in development
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Derived from SPREE_IMAGES_URL (if set) or SPREE_API_URL.
      ...spreeImagePatterns(),
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "https://mirza-spree-backend.onrender.com/admin",
        permanent: false,
      },
      {
        source: "/:country/:locale/admin",
        destination: "https://mirza-spree-backend.onrender.com/admin",
        permanent: false,
      },
    ];
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
