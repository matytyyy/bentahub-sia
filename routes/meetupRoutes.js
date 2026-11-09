const router = require('express').Router();
const c = require('../controllers/meetupController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.getMeetups);                  // INNER JOIN report
router.get('/:id', c.getMeetup);
router.post('/', c.createMeetup);               // runs the scheduling rules
router.put('/:id', c.updateMeetup);             // reschedule (same rules)
router.patch('/:id/status', c.patchStatus);
router.post('/:id/checkin', c.checkIn);
router.delete('/:id', c.deleteMeetup);          // cancel
module.exports = router;
