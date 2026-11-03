// Cabugnason: in-app alerts.
const db = require('../config/db');

exports.create = async (userId, message, conn = db) => {
  await conn.query('INSERT INTO notifications (user_id, message) VALUES (?,?)', [userId, message]);
};

exports.listForUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    [userId]
  );
  return rows;
};

exports.markRead = async (id, userId) => {
  const [r] = await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  return r.affectedRows;
};
