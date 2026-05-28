const expenseService = require('../services/expenseService');

// @desc    Add credit/debit transaction
// @route   POST /api/expenses
// @access  Private
const addTransaction = async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ success: false, message: 'Please provide type, amount, category and date' });
  }

  try {
    const result = await expenseService.addTransaction(
      req.user._id,
      type,
      amount,
      category,
      description,
      date
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get transactions on a specific date (daily expenses)
// @route   GET /api/expenses/daily
// @access  Private
const getDailyExpenses = async (req, res) => {
  const { date } = req.query; // Expecting YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ success: false, message: 'Please provide a date query parameter (YYYY-MM-DD)' });
  }

  try {
    const result = await expenseService.getDailyExpenses(req.user._id, date);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions (Monthly Passbook check credit/debit details)
// @route   GET /api/expenses/passbook
// @access  Private
const getPassbookDetails = async (req, res) => {
  const { month } = req.query; // Optional: YYYY-MM format

  try {
    const result = await expenseService.getPassbookDetails(req.user._id, month);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addTransaction,
  getDailyExpenses,
  getPassbookDetails,
};
