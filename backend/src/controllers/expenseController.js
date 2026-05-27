const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    Add credit/debit transaction
// @route   POST /api/expenses
// @access  Private
const addTransaction = async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ success: false, message: 'Please provide type, amount, category and date' });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Save transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount,
      category,
      description,
      date, // YYYY-MM-DD
    });

    // Update user balance
    if (type === 'credit') {
      user.walletBalance += Number(amount);
    } else if (type === 'debit') {
      user.walletBalance -= Number(amount);
    }
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        transaction,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const transactions = await Transaction.find({ userId: req.user._id, date });
    
    // Calculate total credit and debit for that day
    let totalCredit = 0;
    let totalDebit = 0;
    transactions.forEach(tx => {
      if (tx.type === 'credit') totalCredit += tx.amount;
      if (tx.type === 'debit') totalDebit += tx.amount;
    });

    res.json({
      success: true,
      data: {
        date,
        transactions,
        totalCredit,
        totalDebit,
        netExpense: totalDebit - totalCredit
      }
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
    let query = { userId: req.user._id };
    
    if (month) {
      // Find transactions where the date string starts with the YYYY-MM prefix
      query.date = { $regex: `^${month}` };
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

    // Calculate overall stats for the filtered list
    let totalCredit = 0;
    let totalDebit = 0;
    transactions.forEach(tx => {
      if (tx.type === 'credit') totalCredit += tx.amount;
      if (tx.type === 'debit') totalDebit += tx.amount;
    });

    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalCredit,
          totalDebit,
          balance: totalCredit - totalDebit
        }
      }
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
