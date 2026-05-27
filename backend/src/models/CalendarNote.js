const mongoose = require('mongoose');

const calendarNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: [true, 'Date in YYYY-MM-DD format is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    content: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compounding index to make notes unique per user and date
calendarNoteSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CalendarNote', calendarNoteSchema);
