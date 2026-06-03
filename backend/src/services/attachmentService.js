const mongoose = require('mongoose');
const Attachment = require('../models/Attachment');

/**
 * Create one attachment (image only — no title required)
 */
const createAttachment = async (userId, imageUrl, mimeType = 'image/jpeg', title = '', folderId = null) => {
  if (!imageUrl) {
    throw new Error('Please provide image data');
  }

  const _id = new mongoose.Types.ObjectId();

  let base64Data = imageUrl;
  let mime = mimeType;
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mime = match[1];
      base64Data = match[2];
    }
  }
  const fileBuffer = Buffer.from(base64Data, 'base64');

  const attachment = await Attachment.create({
    _id,
    userId,
    folderId: folderId || null,
    title,
    description: '',
    imageUrl: `/api/attachments/file/${_id}`,
    mimeType: mime,
    fileData: fileBuffer,
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

  const docs = images.map(img => {
    const _id = new mongoose.Types.ObjectId();
    
    let base64Data = img.imageUrl;
    let mime = img.mimeType || 'image/jpeg';
    if (img.imageUrl.startsWith('data:')) {
      const match = img.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        base64Data = match[2];
      }
    }
    const fileBuffer = Buffer.from(base64Data, 'base64');

    return {
      _id,
      userId,
      folderId: folderId || null,
      title: '',
      description: '',
      imageUrl: `/api/attachments/file/${_id}`,
      mimeType: mime,
      fileData: fileBuffer,
    };
  });

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
