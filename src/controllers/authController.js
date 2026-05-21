const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendResetEmail } = require('../utils/brevo'); // ✅ ADD sendResetEmail

// ... (rest of your code stays the same)

// ✅ REPLACE the forgotPassword function with this:
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password request for:', email);
    
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // For security, still return success even if email not found
      console.log('❌ Email not found:', email);
      return res.status(200).json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    console.log('✅ Reset token generated for:', email);
    
    // Send reset email via Brevo
    try {
      await sendResetEmail(email, user.firstName, resetToken);
      console.log('✅ Reset email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }
    
    res.status(200).json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// ✅ REPLACE the validateResetToken function with this:
const validateResetToken = (req, res) => {
  const { token } = req.body;
  console.log('🔍 Validating reset token');
  
  const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  res.status(200).json({ message: 'Token is valid' });
};

// ✅ REPLACE the resetPassword function with this:
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Update password
    user.password = await bcrypt.hash(password, 10);
    
    // Clear reset token
    delete user.resetToken;
    delete user.resetTokenExpiry;
    
    console.log('✅ Password reset for:', user.email);
    res.status(200).json({ message: 'Password reset successfully' });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Make sure all functions are exported
module.exports = { 
  register, 
  verifyEmail, 
  login,
  refreshToken,
  revokeToken,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  update,
  deleteUser
};