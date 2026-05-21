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
router.post('/refresh-token', authController.refreshToken);
router.post('/revoke-token', authController.revokeToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

// User management routes
router.get('/', authController.getAll);
router.get('/:id', authController.getById);
router.put('/:id', authController.update);
router.delete('/:id', authController.delete);

module.exports = router;