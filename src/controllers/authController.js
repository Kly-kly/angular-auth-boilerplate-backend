const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

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

    await sendVerificationEmail(email, verificationToken);

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

module.exports = { register, verifyEmail };