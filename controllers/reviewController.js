// Gemina: Controller for reviews and the trust leaderboard.
const Review = require('../models/reviewModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, toIntInRange, clean } = require('../utils/validate');

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const rows = await Review.leaderboard();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getTiers = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await Review.listTiers() });
});

exports.getReviews = asyncHandler(async (req, res) => {
  const rows = await Review.findAll();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(toId(req.params.id));
  if (!review) throw new AppError('Review not found', 404);
  res.status(200).json({ success: true, data: review });
});

exports.createReview = asyncHandler(async (req, res) => {
  required(req.body, ['meetup_id', 'rating']);
  const result = await Review.create({
    meetup_id: toId(req.body.meetup_id, 'meetup_id'),
    rating: toIntInRange(req.body.rating, 'rating', 1, 5),
    comment: req.body.comment ? clean(req.body.comment).slice(0, 500) : null
  }, req.user);
  res.status(201).json({ success: true, data: result });
});

exports.updateReview = asyncHandler(async (req, res) => {
  const b = req.body;
  if (b.rating === undefined && b.comment === undefined) throw new AppError('Provide rating and/or comment', 400);
  const result = await Review.update(toId(req.params.id), {
    rating: b.rating !== undefined ? toIntInRange(b.rating, 'rating', 1, 5) : undefined,
    comment: b.comment !== undefined ? clean(b.comment).slice(0, 500) : undefined
  }, req.user);
  res.status(200).json({ success: true, data: result });
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const result = await Review.remove(toId(req.params.id), req.user);
  res.status(200).json({ success: true, message: `Review ${result.id} deleted`, data: result });
});
