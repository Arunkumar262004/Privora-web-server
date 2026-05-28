const calendarNoteService = require('../services/calendarNoteService');

// @desc    Add or update note for a date
// @route   POST /api/calendar-notes
// @access  Private
const upsertNote = async (req, res) => {
  const { date, title, content } = req.body;

  if (!date || !title) {
    return res.status(400).json({ success: false, message: 'Please provide date and title' });
  }

  try {
    const note = await calendarNoteService.upsertNote(req.user._id, date, title, content);

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
    const result = await calendarNoteService.getCalendarData(req.user._id, month);

    res.json({
      success: true,
      data: result
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
    const result = await calendarNoteService.deleteNote(req.params.id, req.user._id);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  upsertNote,
  getCalendarData,
  deleteNote,
};
