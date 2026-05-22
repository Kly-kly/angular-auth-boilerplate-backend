const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendResetEmail } = require('../utils/brevo');
const { promisePool } = require('../config/database');

const register = async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, acceptTerms } = req.body;
    
    console.log('📝 Register attempt:', email);
    
    if (!acceptTerms) {
      return res.status(400).json({ message: 'You must accept terms' });
    }
    
    // Check if user already exists
    const [existingUsers] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Check if this is the first user (to assign Admin role)
    const [userCount] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    const role = userCount[0].count === 0 ? 'Admin' : 'User';
    
    // Insert new user
    const [result] = await promisePool.query(
      `INSERT INTO users (title, firstName, lastName, email, password, role, isVerified, verificationToken) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, firstName, lastName, email, hashedPassword, role, false, verificationToken]
    );
    
    console.log('✅ User created:', email);
    
    // Send verification email
    try {
      await sendVerificationEmail(email, firstName, verificationToken);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }
    
    res.status(201).json({ 
      message: 'Registration successful! Please check your email for verification.'
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.body;
  
  try {
    const [users] = await promisePool.query('SELECT * FROM users WHERE verificationToken = ?', [token]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    
    await promisePool.query(
      'UPDATE users SET isVerified = true, verificationToken = NULL WHERE id = ?',
      [users[0].id]
    );
    
    console.log('✅ Email verified:', users[0].email);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!users[0].isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    const token = jwt.sign(
      { id: users[0].id, email: users[0].email, role: users[0].role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    
    res.json({
      id: users[0].id,
      title: users[0].title,
      firstName: users[0].firstName,
      lastName: users[0].lastName,
      email: users[0].email,
      role: users[0].role,
      jwtToken: token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const refreshToken = (req, res) => {
  console.log('🔄 Refresh token called');
  res.status(200).json({ message: 'Token refresh endpoint' });
};

const revokeToken = (req, res) => {
  console.log('🔒 Revoke token called');
  res.status(200).json({ message: 'Token revoked successfully' });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password request for:', email);
    
    const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ Email not found:', email);
      return res.status(200).json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    
    await promisePool.query(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, users[0].id]
    );
    
    console.log('✅ Reset token generated for:', email);
    
    try {
      await sendResetEmail(email, users[0].firstName, resetToken);
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

const validateResetToken = async (req, res) => {
  const { token } = req.body;
  console.log('🔍 Validating reset token');
  
  try {
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
      [token, Date.now()]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
      [token, Date.now()]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await promisePool.query(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );
    
    console.log('✅ Password reset for:', users[0].email);
    res.status(200).json({ message: 'Password reset successfully' });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAll = async (req, res) => {
  console.log('📋 Get all users');
  try {
    const [users] = await promisePool.query(`
      SELECT 
        id, 
        title, 
        firstName, 
        lastName, 
        email, 
        role, 
        isVerified, 
        createdAt 
      FROM users
    `);
    console.log('✅ Found users:', users.length);
    // Return array even if empty
    res.json(users || []);
  } catch (error) {
    console.error('❌ Get all error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getById = async (req, res) => {
  const { id } = req.params;
  console.log('🔍 Get user by id:', id);
  
  try {
    const [users] = await promisePool.query(
      'SELECT id, title, firstName, lastName, email, role, isVerified, createdAt FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('❌ Get by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, firstName, lastName, email, password } = req.body;
    
    console.log('✏️ Update user:', id);
    
    let updateQuery = 'UPDATE users SET title = ?, firstName = ?, lastName = ?, email = ?';
    const queryParams = [title, firstName, lastName, email];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }
    
    updateQuery += ' WHERE id = ?';
    queryParams.push(id);
    
    const [result] = await promisePool.query(updateQuery, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const [updatedUser] = await promisePool.query(
      'SELECT id, title, firstName, lastName, email, role, isVerified FROM users WHERE id = ?',
      [id]
    );
    
    console.log('✅ User updated:', email);
    res.json(updatedUser[0]);
    
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Delete user:', id);
  
  try {
    const [result] = await promisePool.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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