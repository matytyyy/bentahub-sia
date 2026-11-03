// Ib-Ib: Controller for safe meetup zones.
const Zone = require('../models/zoneModel');
const Audit = require('../models/auditModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, clean, toIntInRange, toTime } = require('../utils/validate');

exports.getZones = asyncHandler(async (req, res) => {
  const rows = await Zone.findAllWithCounts();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getTypes = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: await Zone.listTypes() });
});

exports.getZone = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(toId(req.params.id));
  if (!zone) throw new AppError('Zone not found', 404);
  res.status(200).json({ success: true, data: zone });
});

exports.createZone = asyncHandler(async (req, res) => {
  required(req.body, ['zone_type_id', 'zone_name', 'city', 'address']);
  const zone = {
    zone_type_id: toId(req.body.zone_type_id, 'zone_type_id'),
    zone_name: clean(req.body.zone_name),
    city: clean(req.body.city),
    address: clean(req.body.address),
    max_concurrent: req.body.max_concurrent === undefined || req.body.max_concurrent === ''
      ? 2 : toIntInRange(req.body.max_concurrent, 'max_concurrent', 1, 20),
    open_time: toTime(req.body.open_time || '08:00', 'open_time'),
    close_time: toTime(req.body.close_time || '20:00', 'close_time')
  };
  if (zone.open_time >= zone.close_time) throw new AppError('open_time must be earlier than close_time', 400);
  const id = await Zone.create(zone);
  await Audit.log(req.user.id, 'CREATE_ZONE', 'safe_meetup_zones', id);
  res.status(201).json({ success: true, data: await Zone.findById(id) });
});

exports.updateZone = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (!(await Zone.findById(id))) throw new AppError('Zone not found', 404);
  const b = req.body, data = {};
  if (b.zone_type_id !== undefined) data.zone_type_id = toId(b.zone_type_id, 'zone_type_id');
  ['zone_name', 'city', 'address'].forEach((k) => { if (b[k] !== undefined) { required(b, [k]); data[k] = clean(b[k]); } });
  if (b.max_concurrent !== undefined) data.max_concurrent = toIntInRange(b.max_concurrent, 'max_concurrent', 1, 20);
  if (!Object.keys(data).length) throw new AppError('Nothing to update', 400);
  await Zone.update(id, data);
  await Audit.log(req.user.id, 'UPDATE_ZONE', 'safe_meetup_zones', id);
  res.status(200).json({ success: true, data: await Zone.findById(id) });
});

exports.deleteZone = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  if (!(await Zone.findById(id))) throw new AppError('Zone not found', 404);
  await Zone.deactivate(id);
  await Audit.log(req.user.id, 'DEACTIVATE_ZONE', 'safe_meetup_zones', id);
  res.status(200).json({ success: true, message: `Zone ${id} deactivated` });
});
