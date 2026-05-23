const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @openapi
 * /accounts/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is working
 */
router.get('/health', (req, res) => {
  res.json({ message: 'API is working!' });
});

/**
 * @openapi
 * /accounts/register:
 *   post:
 *     summary: Register a new user account
 *     description: Creates a new user account and sends a verification email
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - acceptTerms
 *             properties:
 *               title:
 *                 type: string
 *                 example: Mr
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               acceptTerms:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Registration successful - verification email sent
 *       400:
 *         description: Email already registered or invalid data
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /accounts/verify-email:
 *   post:
 *     summary: Verify a new account
 *     description: Verify a new account with a verification token received by email after registration
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @openapi
 * /accounts/authenticate:
 *   post:
 *     summary: Authenticate account
 *     description: Authenticate account credentials and return a JWT token
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or email not verified
 */
router.post('/authenticate', authController.login);

/**
 * @openapi
 * /accounts/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using refresh token
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: New token generated
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @openapi
 * /accounts/revoke-token:
 *   post:
 *     summary: Revoke refresh token
 *     description: Logout and revoke refresh token
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/revoke-token', authController.revokeToken);

/**
 * @openapi
 * /accounts/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Submit email address to reset the password on an account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset instructions sent if email exists
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /accounts/validate-reset-token:
 *   post:
 *     summary: Validate reset token
 *     description: Validate the reset password token received by email
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.post('/validate-reset-token', authController.validateResetToken);

/**
 * @openapi
 * /accounts/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset the password for an account using a valid token
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token or passwords don't match
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @openapi
 * /accounts:
 *   get:
 *     summary: Get all accounts
 *     description: Get all user accounts (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all accounts
 *       401:
 *         description: Unauthorized
 */
router.get('/', authController.getAll);

/**
 * @openapi
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     description: Get a specific user account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account found
 *       404:
 *         description: Account not found
 */
router.get('/:id', authController.getById);

/**
 * @openapi
 * /accounts/{id}:
 *   put:
 *     summary: Update account
 *     description: Update a user account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated
 *       404:
 *         description: Account not found
 */
router.put('/:id', authController.update);

/**
 * @openapi
 * /accounts/{id}:
 *   delete:
 *     summary: Delete account
 *     description: Delete a user account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: Account not found
 */
router.delete('/:id', authController.deleteUser);

module.exports = router;