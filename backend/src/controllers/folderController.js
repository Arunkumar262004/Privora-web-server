const Folder = require('../models/Folder');
const Attachment = require('../models/Attachment');
const { supabaseAdmin, bucketName } = require('../config/supabase');

// Extract the storage path from a full Supabase storage URL
const extractStoragePath = (imageUrl) => {
  if (!imageUrl) return null;
  const regex = new RegExp(`/object/(?:public|sign)/${bucketName}/(.+?)(?:\\?|$)`);
  const match = imageUrl.match(regex);
  if (match) return match[1];
  const fallback = new RegExp(`/${bucketName}/(.+?)(?:\\?|$)`);
  const m2 = imageUrl.match(fallback);
  return m2 ? m2[1] : null;
};

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

    // Fetch all attachments in this folder to get their storage paths
    const attachments = await Attachment.find({ folderId: req.params.id, userId: req.user._id });

    // ── Delete files from Supabase storage bucket ─────────────────────────────
    const storagePaths = attachments
      .map(a => extractStoragePath(a.imageUrl))
      .filter(Boolean); // remove nulls (e.g. old base64 records)

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(bucketName)
        .remove(storagePaths);
      if (storageError) {
        console.error('Supabase bulk storage delete error:', storageError.message);
      }
    }

    // ── Delete MongoDB records ─────────────────────────────────────────────────
    await Attachment.deleteMany({ folderId: req.params.id, userId: req.user._id });
    await folder.deleteOne();

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
