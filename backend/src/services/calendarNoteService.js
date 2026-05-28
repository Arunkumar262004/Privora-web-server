const CalendarNote = require('../models/CalendarNote');
const Transaction = require('../models/Transaction');

/**
 * Add or update note for a date
 */
const upsertNote = async (userId, date, title, content) => {
  const note = await CalendarNote.findOneAndUpdate(
    { userId, date },
    { title, content: content || '' },
    { new: true, upsert: true, runValidators: true }
  );
  return note;
};

/**
 * Retrieve notes and active transaction indicators for a month
 */
const getCalendarData = async (userId, month) => {
  // Get all custom notes in the specified month
  const notes = await CalendarNote.find({
    userId,
    date: { $regex: `^${month}` }
  });

  // Get all transactions in this month
  const transactions = await Transaction.find({
    userId,
    date: { $regex: `^${month}` }
  }).select('date type amount category description');

  return {
    notes,
    transactions,
  };
};

/**
 * Delete a specific calendar note if owned by the user
 */
const deleteNote = async (noteId, userId) => {
  const note = await CalendarNote.findOne({ _id: noteId, userId });

  if (!note) {
    throw new Error('Note not found');
  }

  await note.deleteOne();
  return { message: 'Note removed' };
};

module.exports = {
  upsertNote,
  getCalendarData,
  deleteNote,
};
