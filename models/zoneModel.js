// Ib-Ib: Model for safe meetup zones (master data).
const db = require('../config/db');
const tx = require('../utils/tx');

// LEFT JOIN report: EVERY zone, even those with zero upcoming meetups (count = 0).
exports.findAllWithCounts = async () => {
  const [rows] = await db.query(`
    SELECT z.id, z.zone_name, z.city, z.address, z.max_concurrent, z.is_active,
           zt.type_name, COUNT(ms.id) AS upcoming_meetups
    FROM safe_meetup_zones z
    INNER JOIN zone_types zt ON zt.id = z.zone_type_id
    LEFT JOIN meetup_schedules ms ON ms.zone_id = z.id AND ms.status IN ('pending','confirmed')
    GROUP BY z.id, z.zone_name, z.city, z.address, z.max_concurrent, z.is_active, zt.type_name
    ORDER BY z.id
  `);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT z.*, zt.type_name FROM safe_meetup_zones z
     INNER JOIN zone_types zt ON zt.id = z.zone_type_id WHERE z.id = ?`, [id]);
  if (!rows[0]) return undefined;
  const [hours] = await db.query(
    'SELECT day_of_week, open_time, close_time FROM zone_operating_hours WHERE zone_id = ? ORDER BY day_of_week', [id]);
  return { ...rows[0], hours };
};

exports.listTypes = async () => {
  const [rows] = await db.query('SELECT id, type_name FROM zone_types ORDER BY id');
  return rows;
};

// Creating a zone also creates its 7 days of operating hours (same transaction).
exports.create = (z) => tx(async (conn) => {
  const [r] = await conn.query(
    'INSERT INTO safe_meetup_zones (zone_type_id, zone_name, city, address, max_concurrent) VALUES (?,?,?,?,?)',
    [z.zone_type_id, z.zone_name, z.city, z.address, z.max_concurrent]);
  await conn.query(
    `INSERT INTO zone_operating_hours (zone_id, day_of_week, open_time, close_time)
     SELECT ?, d.n, ?, ? FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                               UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d`,
    [r.insertId, z.open_time, z.close_time]);
  return r.insertId;
});

exports.update = async (id, z) => {
  await db.query(
    `UPDATE safe_meetup_zones SET zone_type_id = COALESCE(?, zone_type_id), zone_name = COALESCE(?, zone_name),
       city = COALESCE(?, city), address = COALESCE(?, address), max_concurrent = COALESCE(?, max_concurrent)
     WHERE id = ?`,
    [z.zone_type_id ?? null, z.zone_name ?? null, z.city ?? null, z.address ?? null, z.max_concurrent ?? null, id]);
};

// Audited soft delete: meetup history still points at this zone.
exports.deactivate = async (id) => {
  await db.query('UPDATE safe_meetup_zones SET is_active = 0 WHERE id = ?', [id]);
};
