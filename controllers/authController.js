const db = require('../config/db');
exports.getUsers = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, r.role_name 
      FROM users u INNER JOIN user_roles ur ON u.id = ur.user_id 
      INNER JOIN roles r ON ur.role_id = r.id
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};