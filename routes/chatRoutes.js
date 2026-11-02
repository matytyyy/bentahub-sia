const express = require('express');
const router = express.Router();
const { getAudit } = require('../controllers/chatController');
router.get('/audit', getAudit);
module.exports = router;