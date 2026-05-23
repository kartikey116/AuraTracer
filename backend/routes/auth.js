const express = require('express');
const router = express.Router();
const { signup, login, getProfile, logout } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);

module.exports = router;
