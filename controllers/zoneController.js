const db = require('../config/db');
exports.getZones = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT z.zone_name, z.city, COUNT(ms.id) as scheduled_meetups
      FROM safe_meetup_zones z LEFT JOIN meetup_schedules ms ON z.id = ms.zone_id
      GROUP BY z.id
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};