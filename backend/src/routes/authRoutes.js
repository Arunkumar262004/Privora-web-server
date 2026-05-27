const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUsersList,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/login', loginUser);
router.post('/create-user', protect, adminOnly, registerUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, adminOnly, getUsersList);

module.exports = router;
