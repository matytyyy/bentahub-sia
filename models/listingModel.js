// Dinglasan: Model for listings and categories.
const db = require('../config/db');

// RIGHT JOIN report: starts from listings (right side) so listings WITHOUT a category still appear.
exports.findActive = async () => {
  const [rows] = await db.query(`
    SELECT l.id, COALESCE(c.category_name, 'Uncategorized') AS category_name, l.title, l.price,
           l.status, u.full_name AS seller, l.category_id
    FROM categories c
    RIGHT JOIN listings l ON c.id = l.category_id
    INNER JOIN users u ON u.id = l.seller_id
    WHERE l.status = 'active'
    ORDER BY l.id
  `);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM listings WHERE id = ?', [id]);
  if (!rows[0]) return undefined;
  const [images] = await db.query('SELECT id, image_url, is_primary FROM listing_images WHERE listing_id = ?', [id]);
  return { ...rows[0], images };
};

exports.listCategories = async () => {
  const [rows] = await db.query('SELECT id, category_name FROM categories ORDER BY category_name');
  return rows;
};

exports.create = async ({ seller_id, category_id, title, description, price }) => {
  const [r] = await db.query(
    'INSERT INTO listings (seller_id, category_id, title, description, price) VALUES (?,?,?,?,?)',
    [seller_id, category_id ?? null, title, description ?? null, price]);
  return r.insertId;
};

exports.update = async (id, { category_id, title, description, price, status }) => {
  await db.query(
    `UPDATE listings SET category_id = COALESCE(?, category_id), title = COALESCE(?, title),
       description = COALESCE(?, description), price = COALESCE(?, price), status = COALESCE(?, status)
     WHERE id = ?`,
    [category_id ?? null, title ?? null, description ?? null, price ?? null, status ?? null, id]);
};

// Audited soft delete.
exports.markRemoved = async (id) => {
  await db.query("UPDATE listings SET status = 'removed' WHERE id = ?", [id]);
};

exports.addImage = async (listingId, imageUrl, isPrimary) => {
  const [r] = await db.query(
    'INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES (?,?,?)', [listingId, imageUrl, isPrimary ? 1 : 0]);
  return r.insertId;
};
