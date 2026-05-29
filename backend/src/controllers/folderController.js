const Folder = require('../models/Folder');
const Attachment = require('../models/Attachment');

// @desc    Create a new photo album folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide folder name' });
    }

    // Check if duplicate name for user
    const duplicate = await Folder.findOne({ userId: req.user._id, name: name.trim() });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'A folder with this name already exists' });
    }

    const folder = await Folder.create({ userId: req.user._id, name: name.trim() });
    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all photo folders for user
// @route   GET /api/folders
// @access  Private
const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: folders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a folder and all its photos
// @route   DELETE /api/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Delete the folder
    await folder.deleteOne();

    // Delete all attachments belonging to this folder
    await Attachment.deleteMany({ folderId: req.params.id, userId: req.user._id });

    res.json({ success: true, message: 'Folder and its photos deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createFolder,
  getFolders,
  deleteFolder,
};
