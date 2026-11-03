// Espiritu: Controller for meetups. Heavy rules live in the Model (meetupModel.js).
const Meetup = require('../models/meetupModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, toIntInRange, toDateTime } = require('../utils/validate');

exports.getMeetups = asyncHandler(async (req, res) => {
  const rows = await Meetup.findAll(req.user);
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getMeetup = asyncHandler(async (req, res) => {
  const m = await Meetup.findById(toId(req.params.id));
  if (!m) throw new AppError('Meetup not found', 404);
  if (m.buyer_id !== req.user.id && m.seller_id !== req.user.id && !req.user.roles.includes('admin')) {
    throw new AppError('You are not part of this meetup', 403);
  }
  res.status(200).json({ success: true, data: m });
});

exports.createMeetup = asyncHandler(async (req, res) => {
  required(req.body, ['listing_id', 'zone_id', 'scheduled_time']);
  const id = await Meetup.createWithRules({
    listing_id: toId(req.body.listing_id, 'listing_id'),
    zone_id: toId(req.body.zone_id, 'zone_id'),
    scheduled_time: toDateTime(req.body.scheduled_time),
    duration_minutes: req.body.duration_minutes ? toIntInRange(req.body.duration_minutes, 'duration_minutes', 15, 120) : 30
  }, req.user);
  res.status(201).json({ success: true, data: await Meetup.findById(id) });
});

// PUT = reschedule
exports.updateMeetup = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (req.body.zone_id === undefined && req.body.scheduled_time === undefined) {
    throw new AppError('Provide zone_id and/or scheduled_time', 400);
  }
  await Meetup.reschedule(id, {
    zone_id: req.body.zone_id !== undefined ? toId(req.body.zone_id, 'zone_id') : undefined,
    scheduled_time: req.body.scheduled_time !== undefined ? toDateTime(req.body.scheduled_time) : undefined
  }, req.user);
  res.status(200).json({ success: true, data: await Meetup.findById(id) });
});

// PATCH = change status (confirm / complete / cancel)
exports.patchStatus = asyncHandler(async (req, res) => {
  required(req.body, ['status']);
  if (!['confirmed', 'completed', 'cancelled'].includes(req.body.status)) {
    throw new AppError('status must be confirmed, completed or cancelled', 400);
  }
  const result = await Meetup.changeStatus(toId(req.params.id), req.body.status, req.user);
  res.status(200).json({ success: true, data: result });
});

// DELETE = cancel (audited soft delete: the row and its history are kept)
exports.deleteMeetup = asyncHandler(async (req, res) => {
  const result = await Meetup.changeStatus(toId(req.params.id), 'cancelled', req.user);
  res.status(200).json({ success: true, message: `Meetup ${result.id} cancelled`, data: result });
});

exports.checkIn = asyncHandler(async (req, res) => {
  await Meetup.checkIn(toId(req.params.id), req.user);
  res.status(201).json({ success: true, message: 'Checked in' });
});
