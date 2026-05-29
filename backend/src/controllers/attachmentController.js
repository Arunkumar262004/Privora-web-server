const attachmentService = require('../services/attachmentService');

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
      return res.status(201).json({
        success: true,
        count: attachments.length,
        data: attachments,
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

    return res.status(201).json({
      success: true,
      data: attachment,
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
    const attachments = await Attachment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: attachments });
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
};
