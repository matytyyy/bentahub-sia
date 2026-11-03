// Ijan: Model = all SQL for users / roles.
const db = require('../config/db');
const tx = require('../utils/tx');

// INNER JOIN report: only users that have at least one role, one row per (user, role).
exports.findAllWithRoles = async () => {
  const [rows] = await db.query(`
    SELECT u.id, u.username, u.full_name, u.email, u.is_active, r.role_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    ORDER BY u.id, r.role_name
  `);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, username, full_name, email, is_active, created_at FROM users WHERE id = ?', [id]);
  return rows[0];
};

exports.findByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
};

exports.getRoles = async (userId) => {
  const [rows] = await db.query(
    'SELECT r.role_name FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?', [userId]);
  return rows.map((r) => r.role_name);
};

// New accounts start as 'buyer'. Two inserts = one transaction.
exports.create = ({ username, full_name, email, password_hash }) => tx(async (conn) => {
  const [r] = await conn.query(
    'INSERT INTO users (username, full_name, email, password_hash) VALUES (?,?,?,?)',
    [username, full_name, email, password_hash]);
  await conn.query(
    "INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE role_name = 'buyer'", [r.insertId]);
  return r.insertId;
});

exports.update = async (id, { full_name, email }) => {
  await db.query(
    'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ?',
    [full_name ?? null, email ?? null, id]);
};

// Audited soft delete: the row stays (other tables reference it) but the account can't log in.
exports.deactivate = async (id) => {
  await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
};
