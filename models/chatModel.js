const db = require('../config/db');

exports.listForUser = async (userId) => {
  const [rows] = await db.query(`
    SELECT cm.id, cm.listing_id, l.title AS listing, s.full_name AS sender, r.full_name AS receiver,
           cm.message, cm.sent_at, cm.sender_id
    FROM chat_messages cm
    INNER JOIN listings l ON l.id = cm.listing_id
    INNER JOIN users s ON s.id = cm.sender_id
    INNER JOIN users r ON r.id = cm.receiver_id
    WHERE cm.is_deleted = 0 AND (cm.sender_id = ? OR cm.receiver_id = ?)
    ORDER BY cm.sent_at DESC, cm.id DESC
  `, [userId, userId]);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM chat_messages WHERE id = ? AND is_deleted = 0', [id]);
  return rows[0];
};

exports.create = async ({ listing_id, sender_id, receiver_id, message }) => {
  const [r] = await db.query(
    'INSERT INTO chat_messages (listing_id, sender_id, receiver_id, message) VALUES (?,?,?,?)',
    [listing_id, sender_id, receiver_id, message]);
  return r.insertId;
};

exports.updateText = async (id, message) => {
  await db.query('UPDATE chat_messages SET message = ? WHERE id = ?', [message, id]);
};

exports.softDelete = async (id) => {
  await db.query('UPDATE chat_messages SET is_deleted = 1 WHERE id = ?', [id]);
};
