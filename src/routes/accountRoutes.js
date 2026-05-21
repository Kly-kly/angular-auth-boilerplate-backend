const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date() });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'klykly-auth-backend' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

module.exports = router;