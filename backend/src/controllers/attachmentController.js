const attachmentService = require('../services/attachmentService');

// Helper to convert relative imageUrl to absolute URL and exclude fileData
const transformAttachment = (req, attachment) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;
  
  const obj = attachment.toObject ? attachment.toObject() : { ...attachment };
  
  // If the existing imageUrl in DB is a base64 data string, we keep it as is
  // for backward compatibility.
  if (obj.imageUrl && obj.imageUrl.startsWith('data:')) {
    // Keep as is
  } else if (obj.imageUrl) {
    // Make relative imageUrl absolute
    if (obj.imageUrl.startsWith('http://') || obj.imageUrl.startsWith('https://')) {
      // Already absolute
    } else {
      const path = obj.imageUrl.startsWith('/') ? obj.imageUrl : `/${obj.imageUrl}`;
      obj.imageUrl = `${baseUrl}${path}`;
    }
  }
  
  delete obj.fileData;
  return obj;
};

// @desc    Upload one OR multiple attachments (image data only — no title required)
// @route   POST /api/attachments
// @access  Private
const addAttachment = async (req, res) => {
  try {
    const { images, imageUrl, mimeType, folderId } = req.body;

    // ── Bulk upload (array of images) ──────────────────────────────────────────
    if (Array.isArray(images) && images.length > 0) {
      const attachments = await attachmentService.createAttachments(
        req.user._id,
        images,
        folderId || null
      );
      const data = attachments.map(item => transformAttachment(req, item));
      return res.status(201).json({
        success: true,
        count: data.length,
        data: data,
      });
    }

    // ── Single upload (legacy / fallback) ─────────────────────────────────────
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide image data',
      });
    }

    const attachment = await attachmentService.createAttachment(
      req.user._id,
      imageUrl,
      mimeType || 'image/jpeg',
      '',
      folderId || null
    );

    const data = transformAttachment(req, attachment);
    return res.status(201).json({
      success: true,
      data: data,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all attachments for logged in user
// @route   GET /api/attachments
// @access  Private
const fetchAttachments = async (req, res) => {
  try {
    const { folderId } = req.query;
    let query = { userId: req.user._id };

    if (folderId) {
      query.folderId = folderId === 'null' ? null : folderId;
    }

    // If no folderId parameter is provided, we return ALL attachments
    const Attachment = require('../models/Attachment');
    const attachments = await Attachment.find(query)
      .select('-fileData') // Exclude the huge fileData field
      .sort({ createdAt: -1 });

    const data = attachments.map(item => transformAttachment(req, item));
    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get the binary file of an attachment
// @route   GET /api/attachments/file/:id
// @access  Private
const getAttachmentFile = async (req, res) => {
  try {
    const Attachment = require('../models/Attachment');
    
    // Find the attachment for the logged-in user
    const attachment = await Attachment.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    let fileBuffer;
    let contentType = attachment.mimeType || 'image/jpeg';

    if (attachment.fileData) {
      fileBuffer = attachment.fileData;
    } else if (attachment.imageUrl && attachment.imageUrl.startsWith('data:')) {
      // Fallback for old base64 images stored in database
      const match = attachment.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      } else {
        return res.status(400).json({ success: false, message: 'Invalid image data in database' });
      }
    } else {
      return res.status(404).json({ success: false, message: 'Image data not found' });
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific attachment
// @route   DELETE /api/attachments/:id
// @access  Private
const deleteAttachment = async (req, res) => {
  try {
    const Attachment = require('../models/Attachment');
    const attachment = await Attachment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }
    await attachment.deleteOne();
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addAttachment,
  fetchAttachments,
  deleteAttachment,
  getAttachmentFile,
};
