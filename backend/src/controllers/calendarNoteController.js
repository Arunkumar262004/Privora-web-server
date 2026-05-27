const CalendarNote = require('../models/CalendarNote');
const Transaction = require('../models/Transaction');

// @desc    Add or update note for a date
// @route   POST /api/calendar-notes
// @access  Private
const upsertNote = async (req, res) => {
  const { date, title, content } = req.body;

  if (!date || !title) {
    return res.status(400).json({ success: false, message: 'Please provide date and title' });
  }

  try {
    // Find if note already exists for this date and user, then update, else create
    const note = await CalendarNote.findOneAndUpdate(
      { userId: req.user._id, date },
      { title, content },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notes and also summary of transactions by month
// @route   GET /api/calendar-notes
// @access  Private
const getCalendarData = async (req, res) => {
  const { month } = req.query; // Expecting YYYY-MM format

  if (!month) {
    return res.status(400).json({ success: false, message: 'Please provide month parameter (YYYY-MM)' });
  }

  try {
    // Get all custom notes in the specified month
    const notes = await CalendarNote.find({
      userId: req.user._id,
      date: { $regex: `^${month}` }
    });

    // Also get all transactions in this month to show as indicators/summaries on the calendar days
    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $regex: `^${month}` }
    }).select('date type amount category description');

    res.json({
      success: true,
      data: {
        notes,
        transactions,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a calendar note
// @route   DELETE /api/calendar-notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await CalendarNote.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await note.deleteOne();

    res.json({ success: true, message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  upsertNote,
  getCalendarData,
  deleteNote,
};
