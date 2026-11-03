// Gemina: Model for reviews and the automatic seller trust score.
// Trust rule: after EVERY review insert/update/delete the seller's average rating and tier are recalculated.
// A tier needs BOTH a minimum average AND a minimum number of reviews (so 1 five-star review is not "Gold").
const db = require('../config/db');
const tx = require('../utils/tx');
const AppError = require('../utils/AppError');
const Audit = require('./auditModel');

async function recomputeTrust(conn, sellerId) {
  const [[agg]] = await conn.query('SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE seller_id = ?', [sellerId]);
  const avg = agg.n ? Number(agg.avg).toFixed(2) : '0.00';
  const [[tier]] = await conn.query(
    'SELECT id, tier_name FROM trust_tiers WHERE min_score <= ? AND min_reviews <= ? ORDER BY min_score DESC, min_reviews DESC LIMIT 1',
    [avg, agg.n]);
  await conn.query(
    `INSERT INTO seller_trust_scores (seller_id, rating_score, total_reviews, trust_tier_id) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE rating_score = VALUES(rating_score), total_reviews = VALUES(total_reviews),
                             trust_tier_id = VALUES(trust_tier_id)`,
    [sellerId, avg, agg.n, tier.id]);
  return { seller_id: sellerId, rating_score: avg, total_reviews: agg.n, trust_tier: tier.tier_name };
}

// LEFT JOIN report: EVERY seller appears, even those with no reviews yet ('Unrated').
exports.leaderboard = async () => {
  const [rows] = await db.query(`
    SELECT u.id AS seller_id, u.full_name, COALESCE(sts.rating_score, 0) AS rating_score,
           COALESCE(sts.total_reviews, 0) AS total_reviews, COALESCE(tt.tier_name, 'Unrated') AS trust_tier
    FROM users u
    LEFT JOIN seller_trust_scores sts ON sts.seller_id = u.id
    LEFT JOIN trust_tiers tt ON tt.id = sts.trust_tier_id
    WHERE u.is_active = 1 AND EXISTS (SELECT 1 FROM listings l WHERE l.seller_id = u.id)
    ORDER BY sts.rating_score DESC, u.full_name
  `);
  return rows;
};

exports.listTiers = async () => {
  const [rows] = await db.query('SELECT id, tier_name, min_score, min_reviews FROM trust_tiers ORDER BY min_score');
  return rows;
};

exports.findAll = async () => {
  const [rows] = await db.query(`
    SELECT r.id, r.meetup_id, rv.full_name AS reviewer, s.full_name AS seller, r.rating, r.comment, r.created_at
    FROM reviews r
    INNER JOIN users rv ON rv.id = r.reviewer_id
    INNER JOIN users s ON s.id = r.seller_id
    ORDER BY r.created_at DESC, r.id DESC`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
  return rows[0];
};

exports.create = ({ meetup_id, rating, comment }, actor) => tx(async (conn) => {
  const [[m]] = await conn.query('SELECT id, buyer_id, seller_id, status FROM meetup_schedules WHERE id = ? FOR UPDATE', [meetup_id]);
  if (!m) throw new AppError('Meetup not found', 404);
  if (m.buyer_id !== actor.id) throw new AppError('Only the buyer of that meetup can review the seller', 403);
  if (m.status !== 'completed') throw new AppError('You can only review a completed meetup', 400);
  const [r] = await conn.query(
    'INSERT INTO reviews (meetup_id, reviewer_id, seller_id, rating, comment) VALUES (?,?,?,?,?)',
    [meetup_id, actor.id, m.seller_id, rating, comment ?? null]); // 2nd review of same meetup -> 409
  const trust = await recomputeTrust(conn, m.seller_id);
  await Audit.log(actor.id, 'REVIEW_CREATED', 'reviews', r.insertId, conn);
  return { id: r.insertId, trust };
});

exports.update = (id, { rating, comment }, actor) => tx(async (conn) => {
  const [[rv]] = await conn.query('SELECT * FROM reviews WHERE id = ? FOR UPDATE', [id]);
  if (!rv) throw new AppError('Review not found', 404);
  if (rv.reviewer_id !== actor.id) throw new AppError('You can only edit your own review', 403);
  await conn.query('UPDATE reviews SET rating = COALESCE(?, rating), comment = COALESCE(?, comment) WHERE id = ?',
    [rating ?? null, comment ?? null, id]);
  const trust = await recomputeTrust(conn, rv.seller_id);
  await Audit.log(actor.id, 'REVIEW_UPDATED', 'reviews', id, conn);
  return { id, trust };
});

exports.remove = (id, actor) => tx(async (conn) => {
  const [[rv]] = await conn.query('SELECT * FROM reviews WHERE id = ? FOR UPDATE', [id]);
  if (!rv) throw new AppError('Review not found', 404);
  if (rv.reviewer_id !== actor.id && !actor.roles.includes('admin')) throw new AppError('You can only delete your own review', 403);
  await conn.query('DELETE FROM reviews WHERE id = ?', [id]);
  const trust = await recomputeTrust(conn, rv.seller_id);
  await Audit.log(actor.id, 'REVIEW_DELETED', 'reviews', id, conn);
  return { id, trust };
});
