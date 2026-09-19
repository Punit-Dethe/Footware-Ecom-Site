import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Production Pool Lifecycle & Singleton Persistence", () => {
  const originalEnv = { ...process.env };
  const globalForDb = globalThis as unknown as { dbPool?: any };

  beforeEach(() => {
    vi.resetModules();
    delete globalForDb.dbPool;
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
    delete process.env.SUPABASE_DB_CA_CERT_BASE64;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete globalForDb.dbPool;
  });

  it("proves repeated getDbPool() in production returns the identical Pool instance", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const dbModule = await import("../index");

    const pool1 = dbModule.getDbPool();
    const pool2 = dbModule.getDbPool();

    expect(pool1).toBeDefined();
    expect(pool2).toBeDefined();
    expect(pool1).toBe(pool2);
    expect(globalForDb.dbPool).toBe(pool1);
  });

  it("proves repeated query() does not construct a new Pool instance in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const dbModule = await import("../index");

    const poolInstance = dbModule.getDbPool();
    const connectSpy = vi.spyOn(poolInstance, "connect").mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ now: "2026-09-19" }] }),
      release: vi.fn(),
    } as any);

    await dbModule.query("SELECT NOW();");
    await dbModule.query("SELECT NOW();");

    // Proves the same pool instance was reused and connect() called on that single pool
    expect(dbModule.getDbPool()).toBe(poolInstance);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it("proves development behavior remains valid and retains singleton pool", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const dbModule = await import("../index");

    const pool1 = dbModule.getDbPool();
    const pool2 = dbModule.getDbPool();

    expect(pool1).toBe(pool2);
    expect(globalForDb.dbPool).toBe(pool1);
  });

  it("proves transaction() reuses the pool singleton and releases client", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const dbModule = await import("../index");

    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    const poolInstance = dbModule.getDbPool();
    vi.spyOn(poolInstance, "connect").mockResolvedValue(mockClient as any);

    const result = await dbModule.transaction(async (client) => {
      await client.query("SELECT 1;");
      return "tx-success";
    });

    expect(result).toBe("tx-success");
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("SELECT 1;");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
