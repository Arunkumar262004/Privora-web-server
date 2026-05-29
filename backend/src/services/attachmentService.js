const Attachment = require('../models/Attachment');

/**
 * Create one attachment (image only — no title required)
 */
const createAttachment = async (userId, imageUrl, mimeType = 'image/jpeg', title = '', folderId = null) => {
  if (!imageUrl) {
    throw new Error('Please provide image data');
  }

  const attachment = await Attachment.create({
    userId,
    folderId: folderId || null,
    title,
    description: '',
    imageUrl,
    mimeType,
  });

  return attachment;
};

/**
 * Bulk-create multiple attachments at once for a user.
 * images: [{ imageUrl, mimeType }]
 */
const createAttachments = async (userId, images, folderId = null) => {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Please provide at least one image');
  }

  const docs = images.map(img => ({
    userId,
    folderId: folderId || null,
    title: '',
    description: '',
    imageUrl: img.imageUrl,
    mimeType: img.mimeType || 'image/jpeg',
  }));

  const attachments = await Attachment.insertMany(docs);
  return attachments;
};

/**
 * Retrieve all attachments for a specific user
 */
const getAttachments = async (userId) => {
  const attachments = await Attachment.find({ userId }).sort({ createdAt: -1 });
  return attachments;
};

module.exports = {
  createAttachment,
  createAttachments,
  getAttachments,
};
