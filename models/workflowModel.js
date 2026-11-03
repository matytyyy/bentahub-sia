// Cabugnason: UNIQUE FEATURE (workflow + alerts + audit).
// Meetups that are still pending/confirmed AFTER their end time are expired automatically.
// For each one: status change, status-history row, SYSTEM audit entry, and an alert to both people.
const tx = require('../utils/tx');
const Audit = require('./auditModel');
const Notify = require('./notificationModel');

exports.expireStaleMeetups = () => tx(async (conn) => {
  const [stale] = await conn.query(`
    SELECT id, buyer_id, seller_id, status FROM meetup_schedules
    WHERE status IN ('pending','confirmed')
      AND DATE_ADD(scheduled_time, INTERVAL duration_minutes MINUTE) < NOW()
    FOR UPDATE
  `);
  for (const m of stale) {
    await conn.query("UPDATE meetup_schedules SET status = 'expired' WHERE id = ?", [m.id]);
    await conn.query(
      "INSERT INTO meetup_status_history (meetup_id, old_status, new_status, changed_by) VALUES (?,?,'expired',NULL)",
      [m.id, m.status]);
    await Audit.log(null, 'MEETUP_AUTO_EXPIRED', 'meetup_schedules', m.id, conn);
    const text = `Meetup #${m.id} expired because it was not completed in time`;
    await Notify.create(m.buyer_id, text, conn);
    await Notify.create(m.seller_id, text, conn);
  }
  return { expired: stale.length, meetup_ids: stale.map((m) => m.id) };
});
