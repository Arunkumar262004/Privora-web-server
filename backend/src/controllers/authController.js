const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'photowallet_jwt_secret_key_2026_xyz!', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/create-user
// @access  Private/Admin
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all details' });
  }

  try {
    const user = await userService.createUser(name, email, password);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userService.authenticateUser(email, password);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsersList = async (req, res) => {
  try {
    const users = await userService.getUsersList();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset user password
// @route   POST /api/auth/reset-password
// @access  Private
const resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
  }

  try {
    await userService.resetPassword(req.user._id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUsersList,
  resetPassword,
};
