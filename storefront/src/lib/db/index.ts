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
