const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide base64 image data or image URL'],
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
