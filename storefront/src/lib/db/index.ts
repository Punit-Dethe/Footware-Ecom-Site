import "server-only";
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
 * Determines whether SSL should be enabled and validates encryption requirements.
 * Cloud connections require SSL with certificate verification.
 * Localhost may explicitly disable SSL for offline testing.
 */
export function getSslConfig(
  connectionString: string,
): boolean | { rejectUnauthorized: boolean } {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("::1");

  // Localhost may run without SSL for local testing unless explicitly required
  if (isLocal && !connectionString.includes("sslmode=require")) {
    return false;
  }

  // Refuse unencrypted cloud connection
  if (!isLocal && connectionString.includes("sslmode=disable")) {
    throw new Error(
      "[db] Insecure connection refused: Cloud database connection must require SSL encryption (sslmode=disable is forbidden).",
    );
  }

  // Cloud database connections strictly require SSL
  return {
    rejectUnauthorized: true,
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

  if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = pool;
  }

  return pool;
}

/**
 * Executes a parameterized SQL query using the pooled connection.
 */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<R>> {
  const pool = getDbPool();
  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[db] Query error (${duration}ms):`, {
      message: error instanceof Error ? error.message : String(error),
      query: text.slice(0, 100),
    });
    throw error;
  }
}

/**
 * Executes a callback within a managed transaction.
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
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
