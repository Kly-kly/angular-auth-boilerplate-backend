const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/brevo');

// Temporary storage (replace with database later)
let users = [];

const register = async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, acceptTerms } = req.body;
    
    console.log('📝 Register attempt:', email);
    
    if (!acceptTerms) {
      return res.status(400).json({ message: 'You must accept terms' });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const role = users.length === 0 ? 'Admin' : 'User';
    
    const newUser = {
      id: users.length + 1,
      title,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken
    };
    
    users.push(newUser);
    console.log('✅ User created:', email);
    
    // Send verification email
    try {
      await sendVerificationEmail(email, firstName, verificationToken);
      console.log('✅ Email sent to:', email);
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

const verifyEmail = (req, res) => {
  const { token } = req.body;
  const user = users.find(u => u.verificationToken === token);
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid token' });
  }
  
  user.isVerified = true;
  delete user.verificationToken;
  console.log('✅ Email verified:', user.email);
  
  res.json({ message: 'Email verified successfully' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  if (!user.isVerified) {
    return res.status(401).json({ message: 'Please verify your email first' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
  
  res.json({
    id: user.id,
    title: user.title,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    jwtToken: token
  });
};

// ========== NEW FUNCTIONS ==========

const refreshToken = (req, res) => {
  console.log('🔄 Refresh token called');
  // For now, just return success
  res.status(200).json({ message: 'Token refresh endpoint' });
};

const revokeToken = (req, res) => {
  console.log('🔒 Revoke token called');
  res.status(200).json({ message: 'Token revoked successfully' });
};

const forgotPassword = (req, res) => {
  const { email } = req.body;
  console.log('📧 Forgot password for:', email);
  res.status(200).json({ message: 'If email exists, password reset link sent' });
};

const validateResetToken = (req, res) => {
  const { token } = req.body;
  console.log('✅ Validate reset token called');
  res.status(200).json({ message: 'Token is valid' });
};

const resetPassword = (req, res) => {
  const { token, password, confirmPassword } = req.body;
  console.log('🔑 Reset password called');
  res.status(200).json({ message: 'Password reset successfully' });
};

const getAll = (req, res) => {
  console.log('📋 Get all users');
  const usersWithoutPassword = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPassword);
};

const getById = (req, res) => {
  const { id } = req.params;
  console.log('🔍 Get user by id:', id);
  const user = users.find(u => u.id == id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, firstName, lastName, email, password } = req.body;
    
    console.log('✏️ Update user:', id);
    
    const userIndex = users.findIndex(u => u.id == id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (title) users[userIndex].title = title;
    if (firstName) users[userIndex].firstName = firstName;
    if (lastName) users[userIndex].lastName = lastName;
    if (email) users[userIndex].email = email;
    
    // Update password if provided
    if (password) {
      users[userIndex].password = await bcrypt.hash(password, 10);
    }
    
    // Return updated user without password
    const { password: _, ...userWithoutPassword } = users[userIndex];
    
    console.log('✅ User updated:', userWithoutPassword.email);
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = (req, res) => {
  const { id } = req.params;
  console.log('🗑️ Delete user:', id);
  
  const userIndex = users.findIndex(u => u.id == id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
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