const attachmentService = require('../services/attachmentService');
const { supabaseAdmin, bucketName } = require('../config/supabase');

// Extract the storage path from a full Supabase storage URL
// e.g. https://xxx.supabase.co/storage/v1/object/public/Privora/Images/foo.jpg
//  --> Images/foo.jpg
const extractStoragePath = (imageUrl) => {
  if (!imageUrl) return null;
  // Match path after /object/public/<bucket>/ or /object/sign/<bucket>/
  const regex = new RegExp(`/object/(?:public|sign)/${bucketName}/(.+?)(?:\\?|$)`);
  const match = imageUrl.match(regex);
  if (match) return match[1];
  // Fallback: match after /<bucketName>/
  const fallback = new RegExp(`/${bucketName}/(.+?)(?:\\?|$)`);
  const m2 = imageUrl.match(fallback);
  return m2 ? m2[1] : null;
};

// Helper to generate a 1-hour signed URL for a private Supabase file
const getSignedUrl = async (storagePath) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 3600); // 1 hour
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
};

// Helper to convert relative imageUrl to absolute URL and exclude fileData
const transformAttachment = async (req, attachment) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;
  
  const obj = attachment.toObject ? attachment.toObject() : { ...attachment };
  
  if (obj.imageUrl && obj.imageUrl.startsWith('data:')) {
    // Legacy base64 — keep as is
  } else if (obj.imageUrl && (obj.imageUrl.startsWith('http://') || obj.imageUrl.startsWith('https://'))) {
    // Supabase URL — generate a signed URL so private bucket files load correctly
    const storagePath = extractStoragePath(obj.imageUrl);
    if (storagePath) {
      const signed = await getSignedUrl(storagePath);
      if (signed) obj.imageUrl = signed;
    }
    // If signed URL fails, keep original URL as fallback
  } else if (obj.imageUrl) {
    // Relative path — make absolute
    const path = obj.imageUrl.startsWith('/') ? obj.imageUrl : `/${obj.imageUrl}`;
    obj.imageUrl = `${baseUrl}${path}`;
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
      const data = await Promise.all(attachments.map(item => transformAttachment(req, item)));
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

    const data = await transformAttachment(req, attachment);
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

    if (folderId !== undefined) {
      query.folderId = folderId === 'null' ? null : folderId;
    }

    // If no folderId parameter is provided, we return ALL attachments
    const Attachment = require('../models/Attachment');
    const attachments = await Attachment.find(query)
      .select('-fileData') // Exclude the huge fileData field
      .sort({ createdAt: -1 });

    const data = await Promise.all(attachments.map(item => transformAttachment(req, item)));
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
    } else if (attachment.imageUrl && (attachment.imageUrl.startsWith('http://') || attachment.imageUrl.startsWith('https://'))) {
      // Download from Supabase Storage
      const bucketKey = `/${bucketName}/`;
      const urlParts = attachment.imageUrl.split(bucketKey);
      
      if (urlParts.length < 2) {
        return res.status(400).json({ success: false, message: 'Invalid file storage URL' });
      }
      
      const storagePath = urlParts.slice(1).join(bucketKey);

      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .download(storagePath);

      if (error) {
        console.error('Error downloading from Supabase storage:', error);
        return res.status(404).json({ success: false, message: 'File not found in storage' });
      }

      // Convert Blob to Buffer
      fileBuffer = Buffer.from(await data.arrayBuffer());
    } else {
      return res.status(404).json({ success: false, message: 'File content not found' });
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(fileBuffer);
  } catch (error) {
    console.error('getAttachmentFile error:', error);
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

    // ── Delete file from Supabase storage bucket ──────────────────────────────
    if (attachment.imageUrl && (attachment.imageUrl.startsWith('http://') || attachment.imageUrl.startsWith('https://'))) {
      const storagePath = extractStoragePath(attachment.imageUrl);
      if (storagePath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(bucketName)
          .remove([storagePath]);
        if (storageError) {
          // Log but don't block — still remove the DB record
          console.error('Supabase storage delete error:', storageError.message);
        }
      }
    }

    // ── Delete record from MongoDB ─────────────────────────────────────────────
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
