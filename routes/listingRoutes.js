const router = require('express').Router();
const c = require('../controllers/listingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/categories', c.getCategories);     // must come before '/:id'
router.get('/', c.getListings);                 // RIGHT JOIN report
router.get('/:id', c.getListing);
router.post('/', c.createListing);
router.put('/:id', c.updateListing);
router.delete('/:id', c.deleteListing);
router.post('/:id/images', c.addImage);
module.exports = router;
