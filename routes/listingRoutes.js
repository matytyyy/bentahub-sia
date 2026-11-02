const express = require('express');
const router = express.Router();
const { getListings } = require('../controllers/listingController');
router.get('/', getListings);
module.exports = router;
