// Espiritu: UNIQUE FEATURE (rules) - Safe Meetup Scheduling Engine.
// A meetup can only be booked/rescheduled if ALL these rules pass:
//   1. the zone exists and is active           4. the zone is open for the whole meetup that day
//   2. the listing is active, buyer != seller  5. the zone is not full (max_concurrent overlapping meetups)
//   3. the time is in the future               6. neither buyer nor seller is double-booked
// The zone row is locked (FOR UPDATE) so two people can't grab the last slot at the same moment.
const db = require('../config/db');
const tx = require('../utils/tx');
const AppError = require('../utils/AppError');
const Audit = require('./auditModel');
const Notify = require('./notificationModel');

const isAdmin = (u) => u.roles.includes('admin');
const assertParticipant = (m, actor) => {
  if (m.buyer_id !== actor.id && m.seller_id !== actor.id && !isAdmin(actor)) {
    throw new AppError('You are not part of this meetup', 403);
  }
};
const recordHistory = (conn, meetupId, oldStatus, newStatus, changedBy) => conn.query(
  'INSERT INTO meetup_status_history (meetup_id, old_status, new_status, changed_by) VALUES (?,?,?,?)',
  [meetupId, oldStatus, newStatus, changedBy]);

// Two time ranges overlap when: start1 < end2 AND end1 > start2. Back-to-back (end == start) is allowed.
async function assertSlotAvailable(conn, { zone, start, duration, buyerId, sellerId, excludeId = 0 }) {
  const [[future]] = await conn.query('SELECT CAST(? AS DATETIME) > NOW() AS ok', [start]);
  if (!future.ok) throw new AppError('Meetup time must be in the future', 400);

  const [[open]] = await conn.query(
    `SELECT COUNT(*) AS n FROM zone_operating_hours
     WHERE zone_id = ? AND day_of_week = WEEKDAY(?) AND open_time <= TIME(?)
       AND TIME(DATE_ADD(?, INTERVAL ? MINUTE)) <= close_time
       AND DATE(DATE_ADD(?, INTERVAL ? MINUTE)) = DATE(?)`,
    [zone.id, start, start, start, duration, start, duration, start]);
  if (!open.n) throw new AppError('That zone is closed during the requested time', 400);

  const [[full]] = await conn.query(
    `SELECT COUNT(*) AS n FROM meetup_schedules
     WHERE zone_id = ? AND id <> ? AND status IN ('pending','confirmed')
       AND scheduled_time < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(scheduled_time, INTERVAL duration_minutes MINUTE) > ?`,
    [zone.id, excludeId, start, duration, start]);
  if (full.n >= zone.max_concurrent) {
    throw new AppError(`Zone is full at that time (max ${zone.max_concurrent} meetup(s) at once)`, 409);
  }

  const [[busy]] = await conn.query(
    `SELECT COUNT(*) AS n FROM meetup_schedules
     WHERE id <> ? AND status IN ('pending','confirmed') AND (buyer_id IN (?,?) OR seller_id IN (?,?))
       AND scheduled_time < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(scheduled_time, INTERVAL duration_minutes MINUTE) > ?`,
    [excludeId, buyerId, sellerId, buyerId, sellerId, start, duration, start]);
  if (busy.n) throw new AppError('The buyer or the seller already has another meetup at that time', 409);
}

const lockZone = async (conn, zoneId) => {
  const [[zone]] = await conn.query(
    'SELECT id, zone_name, max_concurrent, is_active FROM safe_meetup_zones WHERE id = ? FOR UPDATE', [zoneId]);
  if (!zone) throw new AppError('Zone not found', 404);
  if (!zone.is_active) throw new AppError('That zone is no longer active', 400);
  return zone;
};

const SELECT = `
  SELECT ms.id, l.title AS listing, b.full_name AS buyer, s.full_name AS seller, z.zone_name,
         ms.scheduled_time, ms.duration_minutes, ms.status,
         ms.listing_id, ms.zone_id, ms.buyer_id, ms.seller_id
  FROM meetup_schedules ms
  INNER JOIN listings l ON l.id = ms.listing_id
  INNER JOIN users b ON b.id = ms.buyer_id
  INNER JOIN users s ON s.id = ms.seller_id
  INNER JOIN safe_meetup_zones z ON z.id = ms.zone_id`;

// INNER JOIN report (admins see everything; others see only their own meetups).
exports.findAll = async (actor) => {
  const admin = isAdmin(actor);
  const [rows] = await db.query(
    `${SELECT} ${admin ? '' : 'WHERE ms.buyer_id = ? OR ms.seller_id = ?'} ORDER BY ms.scheduled_time DESC`,
    admin ? [] : [actor.id, actor.id]);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${SELECT} WHERE ms.id = ?`, [id]);
  return rows[0];
};

exports.createWithRules = ({ listing_id, zone_id, scheduled_time, duration_minutes }, actor) => tx(async (conn) => {
  const zone = await lockZone(conn, zone_id);
  const [[listing]] = await conn.query('SELECT id, seller_id, title, status FROM listings WHERE id = ?', [listing_id]);
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.status !== 'active') throw new AppError('That listing is not active anymore', 400);
  if (listing.seller_id === actor.id) throw new AppError('You cannot schedule a meetup on your own listing', 400);

  await assertSlotAvailable(conn, {
    zone, start: scheduled_time, duration: duration_minutes, buyerId: actor.id, sellerId: listing.seller_id });

  const [r] = await conn.query(
    `INSERT INTO meetup_schedules (listing_id, buyer_id, seller_id, zone_id, scheduled_time, duration_minutes)
     VALUES (?,?,?,?,?,?)`,
    [listing_id, actor.id, listing.seller_id, zone_id, scheduled_time, duration_minutes]);
  await recordHistory(conn, r.insertId, null, 'pending', actor.id);
  await Audit.log(actor.id, 'MEETUP_CREATED', 'meetup_schedules', r.insertId, conn);
  await Notify.create(listing.seller_id, `New meetup request #${r.insertId} for "${listing.title}" at ${zone.zone_name}`, conn);
  return r.insertId;
});

// PUT = reschedule (new zone and/or new time). Same rules, ignoring this meetup itself.
exports.reschedule = (id, { zone_id, scheduled_time }, actor) => tx(async (conn) => {
  const [[m]] = await conn.query('SELECT * FROM meetup_schedules WHERE id = ? FOR UPDATE', [id]);
  if (!m) throw new AppError('Meetup not found', 404);
  assertParticipant(m, actor);
  if (!['pending', 'confirmed'].includes(m.status)) throw new AppError(`A ${m.status} meetup cannot be rescheduled`, 400);

  const newZoneId = zone_id ?? m.zone_id;
  const newStart = scheduled_time ?? m.scheduled_time;
  const zone = await lockZone(conn, newZoneId);
  await assertSlotAvailable(conn, {
    zone, start: newStart, duration: m.duration_minutes, buyerId: m.buyer_id, sellerId: m.seller_id, excludeId: id });

  // Moving a confirmed meetup needs the seller to confirm again.
  await conn.query("UPDATE meetup_schedules SET zone_id = ?, scheduled_time = ?, status = 'pending' WHERE id = ?",
    [newZoneId, newStart, id]);
  if (m.status !== 'pending') await recordHistory(conn, id, m.status, 'pending', actor.id);
  await Audit.log(actor.id, 'MEETUP_RESCHEDULED', 'meetup_schedules', id, conn);
  await Notify.create(actor.id === m.buyer_id ? m.seller_id : m.buyer_id, `Meetup #${id} was rescheduled`, conn);
});

const TRANSITIONS = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] };

// PATCH status / DELETE (= cancel). Allowed moves are listed in TRANSITIONS above.
exports.changeStatus = (id, newStatus, actor) => tx(async (conn) => {
  const [[m]] = await conn.query('SELECT * FROM meetup_schedules WHERE id = ? FOR UPDATE', [id]);
  if (!m) throw new AppError('Meetup not found', 404);
  assertParticipant(m, actor);
  if (!(TRANSITIONS[m.status] || []).includes(newStatus)) {
    throw new AppError(`Cannot change a ${m.status} meetup to ${newStatus}`, 400);
  }
  if (newStatus === 'confirmed' && actor.id !== m.seller_id && !isAdmin(actor)) {
    throw new AppError('Only the seller can confirm a meetup', 403);
  }
  if (newStatus === 'completed') {
    const [[c]] = await conn.query('SELECT COUNT(DISTINCT user_id) AS n FROM meetup_checkins WHERE meetup_id = ?', [id]);
    if (c.n < 2) throw new AppError('Both buyer and seller must check in before the meetup can be completed', 400);
    await conn.query("UPDATE listings SET status = 'sold' WHERE id = ?", [m.listing_id]);
  }
  await conn.query('UPDATE meetup_schedules SET status = ? WHERE id = ?', [newStatus, id]);
  await recordHistory(conn, id, m.status, newStatus, actor.id);
  await Audit.log(actor.id, `MEETUP_${newStatus.toUpperCase()}`, 'meetup_schedules', id, conn);
  await Notify.create(actor.id === m.buyer_id ? m.seller_id : m.buyer_id, `Meetup #${id} is now ${newStatus}`, conn);
  return { id, old_status: m.status, status: newStatus };
});

exports.checkIn = (id, actor) => tx(async (conn) => {
  const [[m]] = await conn.query('SELECT * FROM meetup_schedules WHERE id = ? FOR UPDATE', [id]);
  if (!m) throw new AppError('Meetup not found', 404);
  if (m.buyer_id !== actor.id && m.seller_id !== actor.id) throw new AppError('Only the buyer or seller can check in', 403);
  if (m.status !== 'confirmed') throw new AppError('You can only check in to a confirmed meetup', 400);
  await conn.query('INSERT INTO meetup_checkins (meetup_id, user_id) VALUES (?,?)', [id, actor.id]); // duplicate -> 409
  await Audit.log(actor.id, 'MEETUP_CHECKIN', 'meetup_checkins', id, conn);
});
