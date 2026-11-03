const router = require('express').Router();
const c = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', c.register);   // public
router.post('/login', c.login);         // public

router.use(protect);                    // everything below needs a valid token (401 otherwise)
router.get('/users', authorize('admin'), c.getUsers);        // INNER JOIN report (403 if not admin)
router.get('/users/:id', c.getUser);
router.put('/users/:id', c.updateUser);
router.delete('/users/:id', authorize('admin'), c.deleteUser);
module.exports = router;
