const jwt = require('jsonwebtoken');
const Librarian = require('../models/Librarian');
const Member = require('../models/Member');

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get librarian from token
      req.user = await Librarian.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// Student authentication middleware
const protectStudent = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a student token
      if (decoded.type !== 'student') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }

      // Get member from token
      req.student = await Member.findById(decoded.id).select('+password');

      if (!req.student) {
        return res.status(401).json({
          success: false,
          message: 'Student not found'
        });
      }

      if (req.student.isBlocked) {
        return res.status(401).json({
          success: false,
          message: 'Account has been blocked',
          reason: req.student.blockReason
        });
      }

      next();
    } catch (error) {
      console.error('Student auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Flexible auth middleware that accepts both librarian and student tokens
const protectAny = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a student token
      if (decoded.type === 'student') {
        // Get member from token
        req.student = await Member.findById(decoded.id).select('-password');
        
        if (!req.student) {
          return res.status(401).json({
            success: false,
            message: 'Student not found'
          });
        }

        if (req.student.isBlocked) {
          return res.status(401).json({
            success: false,
            message: 'Account has been blocked',
            reason: req.student.blockReason
          });
        }

        // Check if approved for students
        if (req.student.registrationStatus !== 'approved') {
          return res.status(403).json({
            success: false,
            message: 'Account pending approval'
          });
        }
      } else {
        // Assume librarian token
        req.user = await Librarian.findById(decoded.id).select('-password');

        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!req.user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Account has been deactivated'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect, admin, protectStudent, protectAny };
