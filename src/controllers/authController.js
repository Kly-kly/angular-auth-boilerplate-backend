const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const db = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/brevo');

const register = async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, acceptTerms } = req.body;

    if (!acceptTerms) {
      return res.status(400).json({ message: 'You must accept terms and conditions' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const users = await User.getAll();
    const role = users.length === 0 ? 'Admin' : 'User';

    await User.create({
      title, firstName, lastName, email,
      password: hashedPassword,
      role,
      verificationToken
    });

    await sendVerificationEmail(email, firstName, verificationToken);

    res.status(201).json({ message: 'Registration successful! Please check your email for verification.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const verified = await User.verifyEmail(token);
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    let refreshTokens = user.refreshTokens ? JSON.parse(user.refreshTokens) : [];
    refreshTokens.push(refreshToken);
    await User.updateRefreshTokens(user.id, refreshTokens);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAMESITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      id: user.id,
      title: user.title,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      jwtToken: accessToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const users = await User.getAll();
    let foundUser = null;
    for (const user of users) {
      const tokens = user.refreshTokens ? JSON.parse(user.refreshTokens) : [];
      if (tokens.includes(refreshToken)) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(foundUser.id);
    const newRefreshToken = generateRefreshToken();

    let refreshTokens = foundUser.refreshTokens ? JSON.parse(foundUser.refreshTokens) : [];
    refreshTokens = refreshTokens.filter(t => t !== refreshToken);
    refreshTokens.push(newRefreshToken);
    await User.updateRefreshTokens(foundUser.id, refreshTokens);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAMESITE || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      id: foundUser.id,
      title: foundUser.title,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      email: foundUser.email,
      role: foundUser.role,
      jwtToken: newAccessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const revokeToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const users = await User.getAll();
    for (const user of users) {
      const tokens = user.refreshTokens ? JSON.parse(user.refreshTokens) : [];
      if (tokens.includes(refreshToken)) {
        const newTokens = tokens.filter(t => t !== refreshToken);
        await User.updateRefreshTokens(user.id, newTokens);
        break;
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password for:', email);
    
    const user = await User.findByEmail(email);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await db.execute(
        'UPDATE users SET resetToken = ?, resetTokenExpires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE email = ?',
        [resetToken, email]
      );
      await sendResetPasswordEmail(email, user.firstName, resetToken);
    }

    res.json({ message: 'If an account exists with that email, you will receive password reset instructions.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE resetToken = ? AND resetTokenExpires > NOW()',
      [hashedPassword, token]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAll = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { title, firstName, lastName, email, role, password } = req.body;
    const updateData = { title, firstName, lastName, email, role };
    
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await User.updateUser(req.params.id, updateData);
    const updatedUser = await User.findById(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
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