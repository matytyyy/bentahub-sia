const db = require('../config/db');
exports.getMeetups = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT ms.scheduled_time, z.zone_name, ms.status
      FROM meetup_schedules ms INNER JOIN safe_meetup_zones z ON ms.zone_id = z.id
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) { next(err); }
};
