import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "../../supabase/server";
import { isVariantInStock } from "../../types/domain";
import {
  checkDatabaseConnection,
  getDatabaseUrl,
  getDbPool,
  getSslConfig,
  isDatabaseConfigured,
} from "../index";

describe("Database Module & Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Environment Validation", () => {
    it("reports database as not configured when DATABASE_URL is missing", () => {
      expect(isDatabaseConfigured()).toBe(false);
    });

    it("throws descriptive error when getDatabaseUrl() is called without DATABASE_URL", () => {
      expect(() => getDatabaseUrl()).toThrowError(
        /DATABASE_URL environment variable is not configured/,
      );
    });

    it("returns unconfigured status on health check when DATABASE_URL is missing", async () => {
      const result = await checkDatabaseConnection();
      expect(result.ok).toBe(false);
      expect(result.configured).toBe(false);
      expect(result.message).toContain("DATABASE_URL is not configured");
    });

    it("correctly identifies configured DATABASE_URL", () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
      expect(isDatabaseConfigured()).toBe(true);
      expect(getDatabaseUrl()).toBe("postgres://user:pass@localhost:5432/testdb");
    });
  });

  describe("Serverless Connection Pooling & SSL Enforcement", () => {
    it("enforces max: 1 connection per serverless function instance", () => {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
      const pool = getDbPool();
      // pg.Pool options can be inspected via options
      expect(pool.options.max).toBe(1);
    });

    it("permits unencrypted connection only for localhost offline development", () => {
      expect(getSslConfig("postgres://user:pass@localhost:5432/testdb")).toBe(false);
      expect(getSslConfig("postgres://user:pass@127.0.0.1:5432/testdb")).toBe(false);
    });

    it("strictly requires SSL for cloud database connections", () => {
      const ssl = getSslConfig(
        "postgres://postgres.xxx:yyy@aws-0-ap-south-1.pooler.supabase.co:6543/postgres",
      );
      expect(ssl).toEqual({ rejectUnauthorized: true });
    });

    it("refuses unencrypted cloud connections when sslmode=disable is passed", () => {
      expect(() =>
        getSslConfig(
          "postgres://postgres.xxx:yyy@aws-0-ap-south-1.pooler.supabase.co:6543/postgres?sslmode=disable",
        ),
      ).toThrowError(/Insecure connection refused/);
    });
  });

  describe("Supabase Server Configuration", () => {
    it("reports Supabase as not configured when env vars are missing", () => {
      expect(isSupabaseConfigured()).toBe(false);
    });

    it("throws descriptive error when getSupabaseUrl() is called without env var", () => {
      expect(() => getSupabaseUrl()).toThrowError(
        /NEXT_PUBLIC_SUPABASE_URL is not configured/,
      );
    });

    it("throws descriptive error when getSupabasePublishableKey() is called without env var", () => {
      expect(() => getSupabasePublishableKey()).toThrowError(
        /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured/,
      );
    });

    it("correctly identifies configured Supabase credentials", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pk_test_sample_key";
      expect(isSupabaseConfigured()).toBe(true);
      expect(getSupabaseUrl()).toBe("https://example.supabase.co");
      expect(getSupabasePublishableKey()).toBe("pk_test_sample_key");
    });
  });

  describe("Server-Only Module Guard", () => {
    it("ensures db index imports server-only", () => {
      const dbFile = fs.readFileSync(
        path.resolve(process.cwd(), "src/lib/db/index.ts"),
        "utf-8",
      );
      expect(dbFile.startsWith('import "server-only";')).toBe(true);
    });

    it("ensures supabase server client imports server-only", () => {
      const supabaseFile = fs.readFileSync(
        path.resolve(process.cwd(), "src/lib/supabase/server.ts"),
        "utf-8",
      );
      expect(supabaseFile.startsWith('import "server-only";')).toBe(true);
    });
  });

  describe("Domain Model Logic", () => {
    it("derives in_stock status correctly for variants", () => {
      expect(isVariantInStock({ quantity_on_hand: 5, backorderable: false })).toBe(true);
      expect(isVariantInStock({ quantity_on_hand: 0, backorderable: true })).toBe(true);
      expect(isVariantInStock({ quantity_on_hand: 0, backorderable: false })).toBe(false);
      expect(isVariantInStock({ quantity_on_hand: -1, backorderable: false })).toBe(false);
    });
  });

  describe("SQL Schema Migration Hardening Verification", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260911000000_init_ecommerce_schema.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    it("contains the initial migration file", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it("explicitly does NOT create, mock, or alter auth.users schema", () => {
      expect(sql).not.toMatch(/CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?auth\b/i);
      expect(sql).not.toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?auth\.users\b/i);
      expect(sql).not.toMatch(/ALTER\s+TABLE\s+auth\.users\b/i);
    });

    it("defines all 11 domain tables qualified with public schema and without IF NOT EXISTS", () => {
      const expectedTables = [
        "profiles",
        "addresses",
        "categories",
        "products",
        "product_categories",
        "variants",
        "product_images",
        "carts",
        "cart_items",
        "orders",
        "order_items",
      ];

      for (const table of expectedTables) {
        const regex = new RegExp(`CREATE TABLE public\\.${table}\\b`, "i");
        expect(sql).toMatch(regex);
        // Ensure IF NOT EXISTS is NOT present on domain tables
        const ifNotExistsRegex = new RegExp(
          `CREATE TABLE IF NOT EXISTS public\\.${table}\\b`,
          "i",
        );
        expect(sql).not.toMatch(ifNotExistsRegex);
      }
    });

    it("enforces Row Level Security (RLS) on all 11 domain tables", () => {
      const expectedTables = [
        "profiles",
        "addresses",
        "categories",
        "products",
        "product_categories",
        "variants",
        "product_images",
        "carts",
        "cart_items",
        "orders",
        "order_items",
      ];

      for (const table of expectedTables) {
        const rlsRegex = new RegExp(
          `ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`,
          "i",
        );
        expect(sql).toMatch(rlsRegex);
      }
    });

    it("revokes all table permissions from anon and authenticated roles", () => {
      const expectedTables = [
        "profiles",
        "addresses",
        "categories",
        "products",
        "product_categories",
        "variants",
        "product_images",
        "carts",
        "cart_items",
        "orders",
        "order_items",
      ];

      for (const table of expectedTables) {
        const revokeRegex = new RegExp(
          `REVOKE ALL ON TABLE public\\.${table} FROM anon, authenticated;`,
          "i",
        );
        expect(sql).toMatch(revokeRegex);
      }
    });

    it("enforces India / INR store defaults", () => {
      expect(sql).toMatch(/country_iso VARCHAR\(2\) NOT NULL DEFAULT 'IN'/i);
      expect(sql).toMatch(/currency VARCHAR\(3\) NOT NULL DEFAULT 'INR'/i);
    });

    it("defines active cart uniqueness partial indexes for guest and authenticated carts", () => {
      expect(sql).toMatch(/CREATE UNIQUE INDEX idx_carts_active_guest_token/i);
      expect(sql).toMatch(/WHERE guest_token_hash IS NOT NULL AND status = 'active'/i);
      expect(sql).toMatch(/CREATE UNIQUE INDEX idx_carts_active_user/i);
      expect(sql).toMatch(/WHERE user_id IS NOT NULL AND status = 'active'/i);
    });

    it("respects schema restraint rules (no custom users, sessions, resets, or inventory tables)", () => {
      expect(sql).not.toMatch(/CREATE TABLE public\.users\b/i);
      expect(sql).not.toMatch(/CREATE TABLE (?:IF NOT EXISTS )?users \(/i);
      expect(sql).not.toMatch(/CREATE TABLE (?:public\.)?sessions\b/i);
      expect(sql).not.toMatch(/CREATE TABLE (?:public\.)?password_reset/i);
      expect(sql).not.toMatch(/CREATE TABLE (?:public\.)?inventory\b/i);
    });
  });
});
