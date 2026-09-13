import { describe, expect, it } from "vitest";

function matchRemotePattern(
  pattern: { protocol?: string; hostname: string; port?: string; pathname?: string },
  urlStr: string,
): boolean {
  try {
    const parsed = new URL(urlStr);
    if (pattern.protocol && pattern.protocol !== parsed.protocol.replace(":", "")) {
      return false;
    }
    if (pattern.hostname !== parsed.hostname) {
      return false;
    }
    if (pattern.port && pattern.port !== parsed.port) {
      return false;
    }
    if (pattern.pathname) {
      if (pattern.pathname.endsWith("/**")) {
        const prefix = pattern.pathname.slice(0, -3);
        return (
          parsed.pathname === prefix ||
          parsed.pathname.startsWith(`${prefix}/`)
        );
      }
      return pattern.pathname === parsed.pathname;
    }
    return true;
  } catch {
    return false;
  }
}

describe("Next.js RemotePattern Config for Supabase Storage", () => {
  const cleanHost = "hkncfdsvgjopkujmmxem.supabase.co";
  const supabasePattern = {
    protocol: "https",
    hostname: cleanHost,
    pathname: "/storage/v1/object/public/product-media/**",
  };

  it("allows clean Supabase product-media Storage URLs", () => {
    const validUrl = `https://${cleanHost}/storage/v1/object/public/product-media/products/prod-1/hero.webp`;
    expect(matchRemotePattern(supabasePattern, validUrl)).toBe(true);

    const validVariantUrl = `https://${cleanHost}/storage/v1/object/public/product-media/products/prod-1/variants/640.webp`;
    expect(matchRemotePattern(supabasePattern, validVariantUrl)).toBe(true);
  });

  it("rejects unrelated buckets on the same Supabase host", () => {
    const otherBucketUrl = `https://${cleanHost}/storage/v1/object/public/user-avatars/avatar.png`;
    expect(matchRemotePattern(supabasePattern, otherBucketUrl)).toBe(false);

    const privateBucketUrl = `https://${cleanHost}/storage/v1/object/authenticated/product-media/hero.webp`;
    expect(matchRemotePattern(supabasePattern, privateBucketUrl)).toBe(false);
  });

  it("rejects non-storage API endpoints on Supabase host", () => {
    const restUrl = `https://${cleanHost}/rest/v1/products`;
    expect(matchRemotePattern(supabasePattern, restUrl)).toBe(false);

    const authUrl = `https://${cleanHost}/auth/v1/verify`;
    expect(matchRemotePattern(supabasePattern, authUrl)).toBe(false);
  });

  it("rejects other Supabase projects or arbitrary external hosts", () => {
    const otherProject = `https://otherproject12345.supabase.co/storage/v1/object/public/product-media/hero.webp`;
    expect(matchRemotePattern(supabasePattern, otherProject)).toBe(false);

    const untrustedHost = `https://evil-site.com/storage/v1/object/public/product-media/hero.webp`;
    expect(matchRemotePattern(supabasePattern, untrustedHost)).toBe(false);
  });

  it("does not use wildcard host allowance like *.supabase.co", () => {
    expect(supabasePattern.hostname).not.toContain("*");
    expect(supabasePattern.hostname).toBe(cleanHost);
  });
});
