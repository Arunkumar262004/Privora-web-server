const User = require('../models/User');

/**
 * Register a new user
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} The created user
 */
const createUser = async (name, email, password) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
    walletBalance: 0
  });

  return user;
};

/**
 * Authenticate standard or admin user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} The authenticated user
 */
const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  return user;
};

/**
 * Retrieve a user's details by ID
 * @param {string} id 
 * @returns {Promise<Object>} The user profile
 */
const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Get all standard users (role: 'user')
 * @returns {Promise<Array>} List of user objects (excluding password)
 */
const getUsersList = async () => {
  const users = await User.find({ role: 'user' }).select('-password');
  return users;
};

/**
 * Reset user password after validating current password
 * @param {string} userId 
 * @param {string} currentPassword 
 * @param {string} newPassword 
 * @returns {Promise<Object>} The updated user
 */
const resetPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  user.password = newPassword;
  await user.save();

  return user;
};

module.exports = {
  createUser,
  authenticateUser,
  getUserById,
  getUsersList,
  resetPassword,
};
