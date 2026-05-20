const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken };