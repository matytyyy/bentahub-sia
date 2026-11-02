const express = require('express');
const router = express.Router();
const { getMeetups } = require('../controllers/meetupController');
router.get('/', getMeetups);
module.exports = router;