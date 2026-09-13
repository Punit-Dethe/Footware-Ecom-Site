import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}));

import {
  deleteStorageObjects,
  generateMediaStoragePath,
  getStorageAdminClient,
} from "../storage-admin";

describe("Storage Admin Client and Invariants", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  it("fails closed if SUPABASE_SECRET_KEY is missing even if service role key is present", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://hkncfdsvgjopkujmmxem.supabase.co";

    expect(() => getStorageAdminClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is not configured.",
    );
  });

  it("succeeds when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are configured", () => {
    process.env.SUPABASE_SECRET_KEY = "sb_secret_valid_key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://hkncfdsvgjopkujmmxem.supabase.co";
    mockCreateClient.mockReturnValueOnce({ storage: {} });

    const client = getStorageAdminClient();
    expect(client).toBeDefined();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://hkncfdsvgjopkujmmxem.supabase.co",
      "sb_secret_valid_key",
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
  });

  it("generates deterministic collision-resistant storage path", () => {
    const { mediaId, storagePath } = generateMediaStoragePath(
      "prod-123",
      "webp",
      "media-456",
    );
    expect(mediaId).toBe("media-456");
    expect(storagePath).toBe("products/prod-123/media-456/original.webp");
  });

  it("returns structured failure from deleteStorageObjects on storage error", async () => {
    process.env.SUPABASE_SECRET_KEY = "sb_secret_valid_key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://hkncfdsvgjopkujmmxem.supabase.co";

    mockCreateClient.mockReturnValueOnce({
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({
            error: { message: "Internal Storage Exception" },
          }),
        }),
      },
    });

    const res = await deleteStorageObjects(["products/prod-1/med-1/original.webp"]);
    expect(res.success).toBe(false);
    expect(res.failedPaths).toEqual(["products/prod-1/med-1/original.webp"]);
    expect(res.error).toBe("Internal Storage Exception");
  });

  it("verifies 0 references to SUPABASE_SERVICE_ROLE_KEY across B7 media files", () => {
    const storageAdminSrc = fs.readFileSync(
      path.resolve(__dirname, "../storage-admin.ts"),
      "utf8",
    );
    const migrationScriptSrc = fs.readFileSync(
      path.resolve(__dirname, "../../../../scripts/006_b6c_backfill_product_images.mjs"),
      "utf8",
    );

    expect(storageAdminSrc).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(migrationScriptSrc).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("verifies 0 committed DNS overrides (setServers/dns.lookup) in migration script", () => {
    const migrationScriptSrc = fs.readFileSync(
      path.resolve(__dirname, "../../../../scripts/006_b6c_backfill_product_images.mjs"),
      "utf8",
    );

    expect(migrationScriptSrc).not.toContain("setServers");
    expect(migrationScriptSrc).not.toContain("dns.lookup");
    expect(migrationScriptSrc).not.toContain("8.8.8.8");
    expect(migrationScriptSrc).not.toContain("1.1.1.1");
  });
});
