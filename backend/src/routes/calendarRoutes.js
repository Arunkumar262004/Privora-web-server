const express = require('express');
const router = express.Router();
const {
  upsertNote,
  getCalendarData,
  deleteNote,
} = require('../controllers/calendarNoteController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, upsertNote)
  .get(protect, getCalendarData);

router.delete('/:id', protect, deleteNote);

module.exports = router;
