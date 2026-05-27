const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type is required (credit or debit)'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'], // e.g. 'Food', 'Travel', 'Photo Sale', 'Withdrawal'
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: String, // Store in YYYY-MM-DD format for easy daily/monthly queries
      required: [true, 'Date in YYYY-MM-DD format is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
