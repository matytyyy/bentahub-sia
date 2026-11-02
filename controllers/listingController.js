const db = require('../config/db');
exports.getListings = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT c.category_name, l.title, l.price, l.status
      FROM categories c RIGHT JOIN listings l ON c.id = l.category_id
      WHERE l.status = 'active'
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};