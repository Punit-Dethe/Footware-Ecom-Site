import pg from "pg";
import fs from "fs";
import path from "path";

/**
 * Server-only verification script for PostgreSQL connection.
 * Used in local/CI verification. Never exposes credentials.
 */

// Attempt to parse .env.local if DATABASE_URL is not already in process.env
if (!process.env.DATABASE_URL) {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/);
      if (match) {
        process.env.DATABASE_URL = match[1].trim();
        break;
      }
    }
  }
}

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.log("\n=======================================================");
  console.log("LIVE DB VERIFICATION: BLOCKED — credentials/project required");
  console.log("=======================================================");
  console.log("Status: DATABASE_URL environment variable is not configured.");
  console.log("Required for live verification:");
  console.log("  - DATABASE_URL: PostgreSQL connection string (Supabase pooled/direct)");
  console.log("Credentials exposed: NO\n");
  process.exit(0);
}

// Sanitize URL for safe diagnostic logging (strip password)
let sanitizedUrl = "postgresql://***:***@...";
try {
  const parsed = new URL(connectionString);
  parsed.password = "***";
  sanitizedUrl = parsed.toString();
} catch {
  // invalid url format
}

console.log("\n=======================================================");
console.log("DATABASE CONNECTIVITY VERIFICATION");
console.log("=======================================================");
console.log(`Connecting to: ${sanitizedUrl}`);

const sslConfig =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("sslmode=disable")
    ? false
    : { rejectUnauthorized: false };

const client = new pg.Client({
  connectionString,
  ssl: sslConfig,
  connectionTimeoutMillis: 5000,
});

const startTime = Date.now();

try {
  await client.connect();
  const connectDuration = Date.now() - startTime;

  const queryStart = Date.now();
  const res = await client.query(
    "SELECT 1 AS connected, NOW() AS server_time, version() AS version;",
  );
  const queryDuration = Date.now() - queryStart;

  console.log("Status: SUCCESS");
  console.log(`Connection latency: ${connectDuration} ms`);
  console.log(`Query latency: ${queryDuration} ms`);
  console.log(`Server time: ${res.rows[0]?.server_time}`);
  console.log(`PostgreSQL Version: ${res.rows[0]?.version?.split(" on ")[0]}`);

  // Inspect existing schema tables
  const tableCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name LIKE 'spree_%' OR table_name IN ('profiles', 'categories', 'products', 'variants', 'carts', 'orders'));
  `);

  const spreeTables = tableCheck.rows.filter((r) => r.table_name.startsWith("spree_"));
  const domainTables = tableCheck.rows.filter((r) => !r.table_name.startsWith("spree_"));

  console.log("\nSchema Audit:");
  console.log(`- Legacy Spree tables found: ${spreeTables.length}`);
  console.log(`- New domain tables found: ${domainTables.length}`);
  if (spreeTables.length > 0) {
    console.log("  Note: Database contains legacy Spree schema. Clean database recommended.");
  }
  if (domainTables.length > 0) {
    console.log(`  Existing domain tables: ${domainTables.map((t) => t.table_name).join(", ")}`);
  }

  console.log("Credentials exposed: NO");
  console.log("=======================================================\n");
} catch (err) {
  const totalDuration = Date.now() - startTime;
  console.error("\nStatus: FAILED");
  console.error(`Error after ${totalDuration} ms: ${err.message}`);
  console.log("Credentials exposed: NO");
  console.log("=======================================================\n");
  process.exit(1);
} finally {
  await client.end();
}
