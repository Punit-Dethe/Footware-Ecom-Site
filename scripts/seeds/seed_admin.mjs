import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required to run seed_admin.mjs");
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
    // Devise uses bcrypt with cost 12
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    // Also update spree@example.com password just in case
    await pool.query(
      `UPDATE spree_admin_users SET encrypted_password = $1 WHERE email = 'spree@example.com'`,
      [hash]
    );

    // Check if admin@mirzafootwear.com exists
    const existing = await pool.query('SELECT id FROM spree_admin_users WHERE email = $1', [email]);
    let adminId;
    if (existing.rows.length === 0) {
      const res = await pool.query(
        `INSERT INTO spree_admin_users (email, encrypted_password, created_at, updated_at, first_name, last_name)
         VALUES ($1, $2, NOW(), NOW(), 'Mirza', 'Admin') RETURNING id`,
        [email, hash]
      );
      adminId = res.rows[0].id;
      console.log('Created admin user:', email, 'id:', adminId);
    } else {
      adminId = existing.rows[0].id;
      await pool.query(
        `UPDATE spree_admin_users SET encrypted_password = $1, updated_at = NOW() WHERE id = $2`,
        [hash, adminId]
      );
      console.log('Updated admin user:', email, 'id:', adminId);
    }

    // Ensure role assignment for adminId
    const roleRes = await pool.query("SELECT id FROM spree_roles WHERE name = 'admin' LIMIT 1;");
    const roleId = roleRes.rows[0].id;

    const roleUserCheck = await pool.query(
      `SELECT id FROM spree_role_users WHERE user_id = $1 AND user_type = 'Spree::AdminUser'`,
      [adminId]
    );

    if (roleUserCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO spree_role_users (role_id, user_id, user_type, resource_type, resource_id, store_id, created_at, updated_at)
         VALUES ($1, $2, 'Spree::AdminUser', 'Spree::Store', 1, 1, NOW(), NOW())`,
        [roleId, adminId]
      );
      console.log('Assigned admin role to user:', adminId);
    } else {
      console.log('Admin role already assigned to user:', adminId);
    }

    console.log('Admin user setup complete!');
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await pool.end();
  }
}

run();
