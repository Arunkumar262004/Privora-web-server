const attachmentService = require('../services/attachmentService');

// @desc    Upload one OR multiple attachments (image data only — no title required)
// @route   POST /api/attachments
// @access  Private
const addAttachment = async (req, res) => {
  try {
    const { images, imageUrl, mimeType } = req.body;

    // ── Bulk upload (array of images) ──────────────────────────────────────────
    if (Array.isArray(images) && images.length > 0) {
      const attachments = await attachmentService.createAttachments(
        req.user._id,
        images,
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
    const attachments = await attachmentService.getAttachments(req.user._id);
    res.json({ success: true, data: attachments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addAttachment,
  fetchAttachments,
};
