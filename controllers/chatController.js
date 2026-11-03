// Cabugnason: Controller for chat, audit report, notifications, and the workflow trigger.
const Chat = require('../models/chatModel');
const Audit = require('../models/auditModel');
const Notify = require('../models/notificationModel');
const Workflow = require('../models/workflowModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { required, toId, clean } = require('../utils/validate');

const toMessage = (v) => {
  const text = clean(v);
  if (!text || text.length > 1000) throw new AppError('message must be 1-1000 characters', 400);
  return text;
};

exports.getMessages = asyncHandler(async (req, res) => {
  const rows = await Chat.listForUser(req.user.id);
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  required(req.body, ['listing_id', 'receiver_id', 'message']);
  const receiver_id = toId(req.body.receiver_id, 'receiver_id');
  if (receiver_id === req.user.id) throw new AppError('You cannot message yourself', 400);
  const id = await Chat.create({
    listing_id: toId(req.body.listing_id, 'listing_id'), sender_id: req.user.id,
    receiver_id, message: toMessage(req.body.message)
  });
  res.status(201).json({ success: true, data: await Chat.findById(id) });
});

exports.editMessage = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const msg = await Chat.findById(id);
  if (!msg) throw new AppError('Message not found', 404);
  if (msg.sender_id !== req.user.id) throw new AppError('You can only edit your own messages', 403);
  required(req.body, ['message']);
  await Chat.updateText(id, toMessage(req.body.message));
  res.status(200).json({ success: true, data: await Chat.findById(id) });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const id = toId(req.params.id);
  const msg = await Chat.findById(id);
  if (!msg) throw new AppError('Message not found', 404);
  if (msg.sender_id !== req.user.id && !req.user.roles.includes('admin')) throw new AppError('You can only delete your own messages', 403);
  await Chat.softDelete(id);
  await Audit.log(req.user.id, 'DELETE_MESSAGE', 'chat_messages', id);
  res.status(200).json({ success: true, message: `Message ${id} deleted` });
});

// FULL OUTER JOIN report
exports.getAudit = asyncHandler(async (req, res) => {
  const rows = await Audit.fullOuterReport();
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const rows = await Notify.listForUser(req.user.id);
  res.status(200).json({ success: true, count: rows.length, data: rows });
});

exports.readNotification = asyncHandler(async (req, res) => {
  const changed = await Notify.markRead(toId(req.params.id), req.user.id);
  if (!changed) throw new AppError('Notification not found', 404);
  res.status(200).json({ success: true, message: 'Marked as read' });
});

// Manual trigger of the same job the server runs every minute (handy for the live demo).
exports.runWorkflow = asyncHandler(async (req, res) => {
  const result = await Workflow.expireStaleMeetups();
  res.status(200).json({ success: true, data: result });
});
