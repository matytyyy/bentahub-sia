// Dinglasan: Controller for listings.
const Listing = require('../models/listingModel');
const Audit = require('../models/auditModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, clean } = require('../utils/validate');
const { isAdmin } = require('../middleware/auth');

const toPrice = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > 99999999) throw new AppError('price must be a number greater than 0', 400);
  return n;
};

async function ownListing(req) {
  const listing = await Listing.findById(toId(req.params.id));
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.seller_id !== req.user.id && !isAdmin(req.user)) throw new AppError('This is not your listing', 403);
  return listing;
}

exports.getListings = asyncHandler(async (req, res) => {
  const rows = await Listing.findActive();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getCategories = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await Listing.listCategories() });
});

exports.getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(toId(req.params.id));
  if (!listing) throw new AppError('Listing not found', 404);
  res.status(200).json({ success: true, data: listing });
});

exports.createListing = asyncHandler(async (req, res) => {
  required(req.body, ['title', 'price']);
  const id = await Listing.create({
    seller_id: req.user.id,
    category_id: req.body.category_id ? toId(req.body.category_id, 'category_id') : null,
    title: clean(req.body.title),
    description: req.body.description ? clean(req.body.description) : null,
    price: toPrice(req.body.price)
  });
  await Audit.log(req.user.id, 'CREATE_LISTING', 'listings', id);
  res.status(201).json({ success: true, data: await Listing.findById(id) });
});

exports.updateListing = asyncHandler(async (req, res) => {
  await ownListing(req);
  const id = toId(req.params.id), b = req.body, data = {};
  if (b.title !== undefined) { required(b, ['title']); data.title = clean(b.title); }
  if (b.description !== undefined) data.description = clean(b.description);
  if (b.price !== undefined) data.price = toPrice(b.price);
  if (b.category_id !== undefined && b.category_id !== '') data.category_id = toId(b.category_id, 'category_id');
  if (b.status !== undefined) {
    if (!['active', 'sold', 'removed'].includes(b.status)) throw new AppError('status must be active, sold or removed', 400);
    data.status = b.status;
  }
  if (!Object.keys(data).length) throw new AppError('Nothing to update', 400);
  await Listing.update(id, data);
  await Audit.log(req.user.id, 'UPDATE_LISTING', 'listings', id);
  res.status(200).json({ success: true, data: await Listing.findById(id) });
});

exports.deleteListing = asyncHandler(async (req, res) => {
  await ownListing(req);
  const id = toId(req.params.id);
  await Listing.markRemoved(id);
  await Audit.log(req.user.id, 'REMOVE_LISTING', 'listings', id);
  res.status(200).json({ success: true, message: `Listing ${id} removed` });
});

exports.addImage = asyncHandler(async (req, res) => {
  await ownListing(req);
  required(req.body, ['image_url']);
  const url = clean(req.body.image_url);
  if (!/^https?:\/\/\S+$/.test(url)) throw new AppError('image_url must start with http:// or https://', 400);
  const imageId = await Listing.addImage(toId(req.params.id), url, req.body.is_primary);
  res.status(201).json({ success: true, data: { id: imageId, image_url: url } });
});
