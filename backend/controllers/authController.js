const Librarian = require('../models/Librarian');
const generateToken = require('../utils/generateToken');
const { body, validationResult } = require('express-validator');
const { uploadImageBuffer } = require('../utils/cloudinary');

// @desc    Login librarian
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for librarian (explicitly select password)
    const librarian = await Librarian.findOne({ username }).select('+password');

    if (!librarian) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!librarian.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isMatch = await librarian.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    librarian.lastLogin = Date.now();
    await librarian.save();

    // Create token
    const token = generateToken(librarian._id, 'librarian');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: librarian._id,
        username: librarian.username,
        email: librarian.email,
        name: librarian.name,
        role: librarian.role,
        photo: librarian.photo
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new librarian (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
const register = async (req, res, next) => {
  try {
    const { username, email, password, name, role } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if librarian exists
    const librarianExists = await Librarian.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (librarianExists) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create librarian
    const librarian = await Librarian.create({
      username,
      email,
      password,
      name,
      role: role || 'Librarian'
    });

    res.status(201).json({
      success: true,
      message: 'Librarian registered successfully',
      data: {
        id: librarian._id,
        username: librarian.username,
        email: librarian.email,
        name: librarian.name,
        role: librarian.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in librarian
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const librarian = await Librarian.findById(req.user.id);

    res.json({
      success: true,
      data: librarian
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout librarian
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

// @desc    Update librarian profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, username, currentPassword, newPassword, removePhoto } = req.body;

    const librarian = await Librarian.findById(req.user.id).select('+password');

    if (!librarian) {
      return res.status(404).json({
        success: false,
        message: 'Librarian not found'
      });
    }

    // Update basic info
    if (name) librarian.name = name;
    
    // Check if username is being changed and if it's already taken
    if (username && username !== librarian.username) {
      const usernameExists = await Librarian.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already in use'
        });
      }
      librarian.username = username;
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== librarian.email) {
      const emailExists = await Librarian.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      librarian.email = email;
    }

    // Handle photo removal
    if (removePhoto === 'true') {
      librarian.photo = null;
    }
    // Handle photo upload (only if not removing)
    else if (req.file) {
      const uploadedPhoto = await uploadImageBuffer(req.file, 'library-management/admin-photos');
      librarian.photo = uploadedPhoto.secure_url;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password'
        });
      }

      // Verify current password
      const isMatch = await librarian.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      librarian.password = newPassword;
    }

    await librarian.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: librarian._id,
        username: librarian.username,
        email: librarian.email,
        name: librarian.name,
        role: librarian.role,
        photo: librarian.photo
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  logout,
  updateProfile
};
