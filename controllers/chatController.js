const db = require('../config/db');
exports.getAudit = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT u.full_name, al.action as activity, al.created_at FROM users u LEFT JOIN audit_logs al ON u.id = al.user_id
      UNION
      SELECT u.full_name, 'Sent Message' as activity, cm.sent_at as created_at FROM users u RIGHT JOIN chat_messages cm ON u.id = cm.sender_id
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};