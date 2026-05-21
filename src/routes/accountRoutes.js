const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Health check
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Auth routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/authenticate', authController.login);

module.exports = router;