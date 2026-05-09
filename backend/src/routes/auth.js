const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/login', authController.login);
router.get('/verify', authController.verify);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

// Dev-only bypass — sets a test session without going through magic link
router.post('/test-login', authController.testLogin);

module.exports = router;
