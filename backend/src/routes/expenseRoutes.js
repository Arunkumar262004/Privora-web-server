const express = require('express');
const router = express.Router();
const {
  addTransaction,
  getDailyExpenses,
  getPassbookDetails,
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, addTransaction);

router.get('/daily', protect, getDailyExpenses);
router.get('/passbook', protect, getPassbookDetails);

module.exports = router;
