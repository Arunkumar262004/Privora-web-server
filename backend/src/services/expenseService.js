const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * Add a credit or debit transaction and update user balance
 */
const addTransaction = async (userId, type, amount, category, description, date) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Create transaction
  const transaction = await Transaction.create({
    userId,
    type,
    amount,
    category,
    description: description || '',
    date,
  });

  // Update user wallet balance
  if (type === 'credit') {
    user.walletBalance += Number(amount);
  } else if (type === 'debit') {
    user.walletBalance -= Number(amount);
  }
  await user.save();

  return {
    transaction,
    newBalance: user.walletBalance
  };
};

/**
 * Get all transactions on a specific date and calculate daily summary
 */
const getDailyExpenses = async (userId, date) => {
  const transactions = await Transaction.find({ userId, date });
  
  let totalCredit = 0;
  let totalDebit = 0;
  
  transactions.forEach(tx => {
    if (tx.type === 'credit') totalCredit += tx.amount;
    if (tx.type === 'debit') totalDebit += tx.amount;
  });

  return {
    date,
    transactions,
    totalCredit,
    totalDebit,
    netExpense: totalDebit - totalCredit
  };
};

/**
 * Retrieve monthly passbook details with transactions and overall summary
 */
const getPassbookDetails = async (userId, month) => {
  let query = { userId };
  
  if (month) {
    query.date = { $regex: `^${month}` };
  }

  const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

  let totalCredit = 0;
  let totalDebit = 0;
  
  transactions.forEach(tx => {
    if (tx.type === 'credit') totalCredit += tx.amount;
    if (tx.type === 'debit') totalDebit += tx.amount;
  });

  return {
    transactions,
    summary: {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit
    }
  };
};

module.exports = {
  addTransaction,
  getDailyExpenses,
  getPassbookDetails,
};
