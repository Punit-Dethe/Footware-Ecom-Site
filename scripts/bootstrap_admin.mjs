import pg from 'pg';

/**
 * First-Party Operator Admin Bootstrap
 *
 * Promotes a specific Supabase auth user to the administrator role.
 * Requires:
 *   1. Explicit Supabase user UUID passed as first argument.
 *   2. DATABASE_URL configured in the environment.
 *   3. SUPABASE_DB_CA_CERT_BASE64 configured for cloud databases.
 *
 * Contains NO hard-coded users, passwords, or default secrets.
 * Updates public.profiles.role ONLY.
 */

const userId = process.argv[2]?.trim();
const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  console.error("Error: DATABASE_URL environment variable is required.");
  process.exit(1);
}

if (!userId) {
  console.error("Usage: node scripts/bootstrap_admin.mjs <SUPABASE_AUTH_USER_UUID>");
  process.exit(1);
}

// Strict UUID format validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error(`Error: "${userId}" is not a valid UUID.`);
  process.exit(1);
}

const isLocal =
  dbUrl.includes("localhost") ||
  dbUrl.includes("127.0.0.1") ||
  dbUrl.includes("::1");

let sslConfig;
if (isLocal) {
  sslConfig = false;
} else {
  const caBase64 = process.env.SUPABASE_DB_CA_CERT_BASE64?.trim();
  if (!caBase64) {
    console.error("Error: SUPABASE_DB_CA_CERT_BASE64 environment variable is required for cloud database connections.");
    process.exit(1);
  }

  let pem;
  try {
    pem = Buffer.from(caBase64, "base64").toString("utf8").trim();
  } catch {
    console.error("Error: Failed to decode SUPABASE_DB_CA_CERT_BASE64 certificate.");
    process.exit(1);
  }

  if (
    !pem.includes("-----BEGIN CERTIFICATE-----") ||
    !pem.includes("-----END CERTIFICATE-----")
  ) {
    console.error("Error: SUPABASE_DB_CA_CERT_BASE64 does not contain a valid PEM certificate.");
    process.exit(1);
  }

  sslConfig = {
    rejectUnauthorized: true,
    ca: pem,
  };
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function main() {
  try {
    const res = await pool.query(
      `UPDATE public.profiles
       SET role = 'admin', updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, role;`,
      [userId]
    );

    if (res.rows.length === 0) {
      console.error(`Error: User with UUID ${userId} not found in public.profiles.`);
      process.exit(1);
    }

    const row = res.rows[0];
    console.log(`Success: User ${row.id} (${row.first_name || ''} ${row.last_name || ''}) has been promoted to role '${row.role}'.`);
  } catch (err) {
    console.error("Bootstrap execution failed:", err?.message || "Unknown error");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
