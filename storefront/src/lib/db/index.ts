import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg";

/**
 * Server-only PostgreSQL connection pool for Mirza Footwear ecommerce data.
 *
 * Configured for serverless resilience with Supabase Mumbai transaction pooler.
 * Never imported into client bundles.
 */

interface GlobalDbPool {
  dbPool?: Pool;
}

const globalForDb = globalThis as unknown as GlobalDbPool;

/**
 * Validates and retrieves the database connection string.
 * Fails clearly if DATABASE_URL is not configured.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not configured. Database access requires a valid PostgreSQL connection string.",
    );
  }
  return url;
}

/**
 * Checks if the database is configured in the current environment.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Retrieves and decodes the official Supabase CA certificate from SUPABASE_DB_CA_CERT_BASE64.
 * Fails clearly if the variable is missing or does not contain a valid PEM certificate.
 * Never logs certificate contents.
 */
export function getDatabaseCaCertificate(): string {
  const b64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
  if (!b64) {
    throw new Error(
      "[db] Cloud database connection requires SUPABASE_DB_CA_CERT_BASE64 to be configured with the Supabase Root CA certificate.",
    );
  }

  let pem: string;
  try {
    pem = Buffer.from(b64, "base64").toString("utf8").trim();
  } catch {
    throw new Error(
      "[db] Invalid SUPABASE_DB_CA_CERT_BASE64: Failed to decode base64 certificate.",
    );
  }

  if (
    !pem.includes("-----BEGIN CERTIFICATE-----") ||
    !pem.includes("-----END CERTIFICATE-----")
  ) {
    throw new Error(
      "[db] Invalid SUPABASE_DB_CA_CERT_BASE64: Decoded content does not contain a valid PEM certificate.",
    );
  }

  return pem;
}

export type SslConfig = false | { rejectUnauthorized: true; ca: string };

/**
 * Determines whether SSL should be enabled and validates encryption requirements.
 * Cloud connections strictly require SSL with trusted CA verification.
 * Localhost may run without SSL for offline testing.
 * Prevents node-postgres parameter override by banning SSL query parameters on cloud DATABASE_URL.
 */
export function getSslConfig(connectionString: string): SslConfig {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("::1");

  // Localhost may run without SSL for offline development
  if (isLocal) {
    return false;
  }

  // Refuse connection strings with embedded SSL query parameters to prevent node-postgres overrides
  const forbiddenParams = ["sslmode", "sslcert", "sslkey", "sslrootcert"];
  for (const param of forbiddenParams) {
    const regex = new RegExp(`[?&]${param}(?:=|[&#]|$)`, "i");
    if (regex.test(connectionString)) {
      throw new Error(
        `[db] Insecure or conflicting SSL parameter '${param}' detected in cloud DATABASE_URL. SSL configuration must be managed strictly via application pool options rather than connection string query parameters.`,
      );
    }
  }

  // Cloud database connections strictly require SSL with trusted CA
  const ca = getDatabaseCaCertificate();

  return {
    rejectUnauthorized: true,
    ca,
  };
}

/**
 * Creates or retrieves the singleton connection pool.
 */
export function getDbPool(): Pool {
  if (globalForDb.dbPool) {
    return globalForDb.dbPool;
  }

  const connectionString = getDatabaseUrl();
  const pool = new Pool({
    connectionString,
    ssl: getSslConfig(connectionString),
    max: 1, // Serverless safe: 1 connection per function instance against transaction pooler
    idleTimeoutMillis: 10_000, // Close idle clients after 10 seconds
    connectionTimeoutMillis: 5_000, // Fail fast after 5 seconds if connection stalled
  });

  // Prevent unhandled error events crashing Node process
  pool.on("error", (err) => {
    console.error("[db] Unexpected idle PostgreSQL client error:", err.message);
  });

  // Fluid compute safe attachment: register pool with Vercel function suspension manager exactly once
  try {
    if (typeof attachDatabasePool === "function") {
      attachDatabasePool(pool);
    }
  } catch {
    // Non-Vercel environments or unsupported runtimes proceed safely
  }

  // Unconditional singleton assignment ensures warm Vercel lambda instances retain pool
  globalForDb.dbPool = pool;

  return pool;
}

function isPerfDiagnosticsEnabled(): boolean {
  return process.env.PERF_DIAGNOSTICS === "1";
}

function inferOperationName(text: string): string {
  const normalized = text.trim().toUpperCase();
  if (normalized.startsWith("SELECT") && normalized.includes("FROM PUBLIC.CARTS")) return "cart.find";
  if (normalized.startsWith("SELECT") && normalized.includes("FROM PUBLIC.CART_ITEMS")) return "cart.items";
  if (
    normalized.includes("INTO PUBLIC.CART_ITEMS") ||
    normalized.includes("UPDATE PUBLIC.CART_ITEMS") ||
    normalized.includes("DELETE FROM PUBLIC.CART_ITEMS")
  ) {
    return "cart.mutate";
  }
  if (normalized.includes("FROM PUBLIC.VARIANTS")) return "variant.resolve";
  if (normalized.includes("INTO PUBLIC.ORDERS") || normalized.includes("INTO PUBLIC.ORDER_ITEMS")) return "order.place";
  if (normalized.includes("PUBLIC.CATEGORIES")) return "catalog.categories";
  if (normalized.includes("PUBLIC.PRODUCTS")) return "catalog.products";
  return "db.query";
}

function logPerfTiming(metric: {
  type: "query" | "transaction";
  op: string;
  totalMs: number;
  connectMs?: number;
  sqlMs?: number;
  txMs?: number;
  poolState: { total: number; idle: number; waiting: number };
}) {
  if (!isPerfDiagnosticsEnabled()) return;
  const parts = [
    `[db:perf] ${metric.type}:${metric.op}`,
    `total=${metric.totalMs}ms`,
  ];
  if (metric.connectMs != null) parts.push(`conn=${metric.connectMs}ms`);
  if (metric.sqlMs != null) parts.push(`sql=${metric.sqlMs}ms`);
  if (metric.txMs != null) parts.push(`tx=${metric.txMs}ms`);
  parts.push(`pool(tot=${metric.poolState.total},idle=${metric.poolState.idle},wait=${metric.poolState.waiting})`);
  console.log(parts.join(" | "));
}

/**
 * Executes a parameterized SQL query using the pooled connection.
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
  opName?: string,
): Promise<QueryResult<R>> {
  const pool = getDbPool();
  const op = opName || inferOperationName(text);
  const start = performance.now();
  const poolState = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  const client = await pool.connect();
  const connEnd = performance.now();
  try {
    const sqlStart = performance.now();
    const res = await client.query<R>(text, params);
    const sqlEnd = performance.now();

    const totalMs = Math.round(sqlEnd - start);
    const connMs = Math.round(connEnd - start);
    const sqlMs = Math.round(sqlEnd - sqlStart);

    logPerfTiming({
      type: "query",
      op,
      totalMs,
      connectMs: connMs,
      sqlMs,
      poolState,
    });

    return res;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    console.error(`[db] Query error (${op}, ${duration}ms):`, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Executes a callback within a managed transaction.
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  opName = "tx",
): Promise<T> {
  const pool = getDbPool();
  const start = performance.now();
  const poolState = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  const client = await pool.connect();
  const acqEnd = performance.now();
  const acqMs = Math.round(acqEnd - start);
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    const end = performance.now();
    const txMs = Math.round(end - acqEnd);
    const totalMs = Math.round(end - start);

    logPerfTiming({
      type: "transaction",
      op: opName,
      totalMs,
      connectMs: acqMs,
      txMs,
      poolState,
    });

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    const duration = Math.round(performance.now() - start);
    console.error(`[db] Transaction error (${opName}, ${duration}ms):`, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    client.release();
  }
}

export interface DbHealthResult {
  ok: boolean;
  configured: boolean;
  message: string;
  latencyMs?: number;
  serverTime?: string;
}

/**
 * Diagnostic health check verifying connection and query execution.
 * Does not expose raw credentials or sensitive connection strings.
 */
export async function checkDatabaseConnection(): Promise<DbHealthResult> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "DATABASE_URL is not configured in current environment.",
    };
  }

  const start = Date.now();
  try {
    const res = await query<{ now: string }>("SELECT NOW() AS now;");
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      configured: true,
      message: "Database connection healthy.",
      latencyMs,
      serverTime: res.rows[0]?.now,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      configured: true,
      message: `Database connection failed (${latencyMs}ms): ${err instanceof Error ? err.message : String(err)}`,
      latencyMs,
    };
  }
}
