import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const storefrontRequire = createRequire(path.join(rootDir, 'storefront', 'package.json'));
const { Client } = storefrontRequire('pg');

// Simple dotenv loader
function loadEnv() {
  const candidatePaths = [
    path.join(rootDir, 'storefront', '.env.local'),
    path.join(rootDir, '.env.local'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

function getDatabaseCaCertificate() {
  const b64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
  if (!b64) {
    throw new Error(
      "[db] Cloud database connection requires SUPABASE_DB_CA_CERT_BASE64 to be configured with the Supabase Root CA certificate.",
    );
  }

  let pem;
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

function getSslConfig(connectionString) {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("::1");

  if (isLocal) {
    return false;
  }

  const forbiddenParams = ["sslmode", "sslcert", "sslkey", "sslrootcert"];
  for (const param of forbiddenParams) {
    const regex = new RegExp(`[?&]${param}(?:=|[&#]|$)`, "i");
    if (regex.test(connectionString)) {
      throw new Error(
        `[db] Insecure or conflicting SSL parameter '${param}' detected in cloud DATABASE_URL. SSL configuration must be managed strictly via application pool options rather than connection string query parameters.`,
      );
    }
  }

  const ca = getDatabaseCaCertificate();

  return {
    rejectUnauthorized: true,
    ca,
  };
}

async function verify() {
  const dbUrl = process.env.DATABASE_URL;
  const configured = Boolean(dbUrl);

  console.log(`configured: ${configured}`);

  if (!configured) {
    console.error('DATABASE_URL is not set in environment or .env.local');
    process.exit(1);
  }

  const ssl = getSslConfig(dbUrl);
  const client = new Client({
    connectionString: dbUrl,
    ssl,
  });

  const t0 = performance.now();
  await client.connect();
  const tConnect = performance.now();
  const coldLatency = (tConnect - t0).toFixed(1);

  // Inspect TLS authorization
  const stream = client.connection.stream;
  const authorized = stream?.authorized;
  const authorizationError = stream?.authorizationError || null;

  const tQ0 = performance.now();
  const res = await client.query('SELECT NOW() as now, version() as version;');
  const tQ1 = performance.now();
  const warmLatency = (tQ1 - tQ0).toFixed(1);

  console.log('connection: healthy');
  console.log('TLS authorized:', authorized);
  console.log('authorization error:', authorizationError);
  console.log('SELECT NOW(): successful');
  console.log(`cold connection latency: ${coldLatency} ms`);
  console.log(`warm query latency: ${warmLatency} ms`);
  console.log(`Postgres server version: ${res.rows[0].version}`);

  await client.end();
}

verify().catch(err => {
  console.error('connection: failed');
  console.error(err.message);
  process.exit(1);
});
