import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "../../supabase/server";
import { isVariantInStock } from "../../types/domain";
import {
  checkDatabaseConnection,
  getDatabaseUrl,
  isDatabaseConfigured,
} from "../index";

describe("Database Module & Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
      expect(getDatabaseUrl()).toBe(
        "postgres://user:pass@localhost:5432/testdb",
      );
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

    it("throws descriptive error when getSupabaseAnonKey() is called without env var", () => {
      expect(() => getSupabaseAnonKey()).toThrowError(
        /NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured/,
      );
    });

    it("correctly identifies configured Supabase credentials", () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-test";
      expect(isSupabaseConfigured()).toBe(true);
      expect(getSupabaseUrl()).toBe("https://example.supabase.co");
      expect(getSupabaseAnonKey()).toBe("anon-key-test");
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
      expect(
        isVariantInStock({ quantity_on_hand: 5, backorderable: false }),
      ).toBe(true);
      expect(
        isVariantInStock({ quantity_on_hand: 0, backorderable: true }),
      ).toBe(true);
      expect(
        isVariantInStock({ quantity_on_hand: 0, backorderable: false }),
      ).toBe(false);
      expect(
        isVariantInStock({ quantity_on_hand: -1, backorderable: false }),
      ).toBe(false);
    });
  });

  describe("SQL Schema Migration Verification", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260911000000_init_ecommerce_schema.sql",
    );

    it("contains the initial migration file", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it("defines exactly the 11 required domain tables", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
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
        const regex = new RegExp(
          `CREATE TABLE (?:IF NOT EXISTS )?${table}\\b`,
          "i",
        );
        expect(sql).toMatch(regex);
      }
    });

    it("respects schema restraint rules (no custom users, sessions, resets, or inventory tables)", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      // Must NOT create custom public.users, sessions, or inventory tables
      expect(sql).not.toMatch(
        /CREATE TABLE (?:IF NOT EXISTS )?public\.users\b/i,
      );
      expect(sql).not.toMatch(/CREATE TABLE (?:IF NOT EXISTS )?users \(/i);
      expect(sql).not.toMatch(/CREATE TABLE (?:IF NOT EXISTS )?sessions\b/i);
      expect(sql).not.toMatch(
        /CREATE TABLE (?:IF NOT EXISTS )?password_reset/i,
      );
      expect(sql).not.toMatch(/CREATE TABLE (?:IF NOT EXISTS )?inventory\b/i);
    });

    it("enforces hierarchical category model via parent_id", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toMatch(/parent_id UUID REFERENCES categories\(id\)/i);
    });

    it("tracks inventory directly on the variants table", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toMatch(/quantity_on_hand INT NOT NULL DEFAULT 0/i);
      expect(sql).toMatch(/backorderable BOOLEAN NOT NULL DEFAULT FALSE/i);
    });
  });
});
