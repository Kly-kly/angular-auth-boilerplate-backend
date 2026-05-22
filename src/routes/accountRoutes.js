const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/authenticate', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/revoke-token', authController.revokeToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

// User management routes
router.get('/', authController.getAll);  // ← This now returns all users
router.get('/:id', authController.getById);
router.put('/:id', authController.update);
router.delete('/:id', authController.deleteUser);

// Health check - moved to a different path
router.get('/health', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;