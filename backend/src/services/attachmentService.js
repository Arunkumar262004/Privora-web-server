const Attachment = require('../models/Attachment');

/**
 * Create a new photo attachment
 */
const createAttachment = async (userId, title, description, imageUrl) => {
  if (!title || !imageUrl) {
    throw new Error('Please provide title and photo image data');
  }

  const attachment = await Attachment.create({
    userId,
    title,
    description: description || '',
    imageUrl,
  });

  return attachment;
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
  getAttachments,
};
