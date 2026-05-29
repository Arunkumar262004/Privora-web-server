const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate folder names for the same user
folderSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
