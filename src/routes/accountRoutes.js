const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const accountController = require('../controllers/accountController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);

// Protected routes (Admin only)
router.get('/', authenticate, authorize('Admin'), accountController.getAccounts);
router.get('/:id', authenticate, accountController.getAccountById);

module.exports = router;