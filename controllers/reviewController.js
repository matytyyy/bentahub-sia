const db = require('../config/db');
exports.getLeaderboard = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT u.full_name, sts.rating_score, sts.trust_tier
      FROM users u LEFT JOIN seller_trust_scores sts ON u.id = sts.seller_id
      WHERE sts.rating_score IS NOT NULL ORDER BY sts.rating_score DESC
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};