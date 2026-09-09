import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required to run seed_customer_user.mjs");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const email = 'admin@mirzafootwear.com';
    const password = 'MirzaAdmin2026!';
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    const existing = await pool.query('SELECT id FROM spree_users WHERE email = $1;', [email]);
    let userId;
    if (existing.rows.length === 0) {
      const res = await pool.query(
        `INSERT INTO spree_users (email, login, encrypted_password, first_name, last_name, created_at, updated_at)
         VALUES ($1, $1, $2, 'Mirza', 'Admin', NOW(), NOW()) RETURNING id;`,
        [email, hash]
      );
      userId = res.rows[0].id;
      console.log('Created customer user:', email, 'id:', userId);
    } else {
      userId = existing.rows[0].id;
      await pool.query(
        `UPDATE spree_users SET encrypted_password = $1, updated_at = NOW() WHERE id = $2;`,
        [hash, userId]
      );
      console.log('Updated customer user:', email, 'id:', userId);
    }

    // Role assignment
    const roleRes = await pool.query("SELECT id FROM spree_roles WHERE name = 'admin' LIMIT 1;");
    const roleId = roleRes.rows[0].id;

    const roleCheck = await pool.query(
      `SELECT id FROM spree_role_users WHERE user_id = $1 AND user_type = 'Spree::User';`,
      [userId]
    );
    if (roleCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO spree_role_users (role_id, user_id, user_type, resource_type, resource_id, store_id, created_at, updated_at)
         VALUES ($1, $2, 'Spree::User', 'Spree::Store', 1, 1, NOW(), NOW());`,
        [roleId, userId]
      );
      console.log('Assigned admin role to customer user in spree_role_users');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
