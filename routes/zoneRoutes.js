const router = require('express').Router();
const c = require('../controllers/zoneController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/types', c.getTypes);               // must come before '/:id'
router.get('/', c.getZones);                    // LEFT JOIN report
router.get('/:id', c.getZone);
router.post('/', authorize('admin'), c.createZone);
router.put('/:id', authorize('admin'), c.updateZone);
router.delete('/:id', authorize('admin'), c.deleteZone);
module.exports = router;
