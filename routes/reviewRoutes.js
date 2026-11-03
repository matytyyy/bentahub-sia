const router = require('express').Router();
const c = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/leaderboard', c.getLeaderboard);   // LEFT JOIN report (before '/:id')
router.get('/tiers', c.getTiers);
router.get('/', c.getReviews);
router.get('/:id', c.getReview);
router.post('/', c.createReview);
router.put('/:id', c.updateReview);
router.delete('/:id', c.deleteReview);
module.exports = router;
