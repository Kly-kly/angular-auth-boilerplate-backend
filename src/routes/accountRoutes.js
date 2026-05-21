const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Temporary storage (replace with database later)
let users = [];

// Health check
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, acceptTerms } = req.body;
    
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
    
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:4200'}/account/verify-email?token=${verificationToken}`;
    
    res.status(201).json({ 
      message: 'Registration successful!', 
      verifyUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email
router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  const user = users.find(u => u.verificationToken === token);
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid token' });
  }
  
  user.isVerified = true;
  delete user.verificationToken;
  
  res.json({ message: 'Email verified successfully' });
});

// Login
router.post('/authenticate', async (req, res) => {
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
});

// Get all users (Admin only)
router.get('/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    const safeUsers = users.map(u => ({
      id: u.id,
      title: u.title,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified
    }));
    
    res.json(safeUsers);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;