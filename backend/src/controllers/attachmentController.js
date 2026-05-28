const attachmentService = require('../services/attachmentService');

// @desc    Upload a new attachment (photo/receipt)
// @route   POST /api/attachments
// @access  Private
const addAttachment = async (req, res) => {
  const { title, description, imageUrl } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ success: false, message: 'Please provide title and image data' });
  }

  try {
    const attachment = await attachmentService.createAttachment(
      req.user._id,
      title,
      description,
      imageUrl
    );

    res.status(201).json({
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

    res.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addAttachment,
  fetchAttachments,
};
