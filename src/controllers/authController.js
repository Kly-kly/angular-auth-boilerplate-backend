const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
  
  const jwt = require('jsonwebtoken');
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

module.exports = { register, verifyEmail, login };