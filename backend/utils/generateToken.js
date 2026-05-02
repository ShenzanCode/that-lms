const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, type = 'librarian') => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = generateToken;
