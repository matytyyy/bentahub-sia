const router = require('express').Router();
const c = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/messages', c.getMessages);
router.post('/messages', c.sendMessage);
router.put('/messages/:id', c.editMessage);
router.delete('/messages/:id', c.deleteMessage);
router.get('/audit', authorize('admin'), c.getAudit);            // FULL OUTER JOIN report
router.get('/notifications', c.getNotifications);
router.patch('/notifications/:id/read', c.readNotification);
router.post('/workflow/run', authorize('admin'), c.runWorkflow); // auto-expiry job, on demand
module.exports = router;
