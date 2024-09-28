const router = require('express').Router();
const authController = require('./controllers/auth-controller');
const activateController = require('./controllers/activate-controller');
const authMiddleware = require('./middlewares/auth-middleware');
const roomsController = require('./controllers/rooms-controller');

router.post('/api/send-otp', authController.sendOtp);
router.post('/api/verify-otp', authController.verifyOtp);
router.post('/api/activate', activateController.activate);
router.get('/api/refresh', authController.refresh);
router.post('/api/logout', authController.logout);
router.post('/api/rooms', roomsController.create);
router.get('/api/rooms', roomsController.index);
router.get('/api/rooms/:roomId', roomsController.show);
router.get('/api/test', (req, res) => res.json({ msg: 'OK' }));

module.exports = router;
