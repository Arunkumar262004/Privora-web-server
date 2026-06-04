const mongoose = require('mongoose');
const Attachment = require('../models/Attachment');
const { supabaseAdmin, bucketName } = require('../config/supabase');

/**
 * Helper function to validate file and upload it to Supabase Storage
 * @param {Buffer} fileBuffer The binary content of the file
 * @param {string} fileName The name of the file
 * @param {string} mimeType The MIME type of the file
 * @returns {Promise<string>} The public URL of the uploaded file in Supabase
 */
const uploadToSupabase = async (fileBuffer, fileName, mimeType) => {
  // 1. Max size check: 10 MB (10 * 1024 * 1024 = 10,485,760 bytes)
  const maxBytes = 10485760; 
  if (fileBuffer.byteLength > maxBytes) {
    throw new Error('File size exceeds the limit of 10MB.');
  }

  // 2. Reject ZIP files by file extension and MIME type
  const mimeLower = mimeType.toLowerCase();
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  const isZipMime = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/octet-stream' // sometimes zip is uploaded as octet-stream
  ].includes(mimeLower);

  const isZipExt = fileExt === 'zip';

  if (isZipMime || isZipExt) {
    throw new Error('ZIP files are not allowed.');
  }

  // 3. Classify folder path based on file type
  // Store image in 'Images' folder, others in 'Documents'
  const isImage = mimeLower.startsWith('image/');
  const folder = isImage ? 'Images' : 'Documents';
  
  // Clean file name
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${cleanName}`;

  // 4. Upload binary to Supabase
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // 5. Get the public URL of the uploaded asset
  const { data: urlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
};

/**
 * Create one attachment (uploads file to Supabase and saves metadata in MongoDB)
 */
const createAttachment = async (userId, imageUrl, mimeType = 'image/jpeg', title = '', folderId = null) => {
  if (!imageUrl) {
    throw new Error('Please provide file data');
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

  // Determine a safe file name based on title or ID
  const fileExt = mime.split('/').pop() || 'dat';
  const nameSlug = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'upload';
  const fileName = `${nameSlug}_${_id}.${fileExt}`;

  // Upload to Supabase Storage
  const supabaseUrl = await uploadToSupabase(fileBuffer, fileName, mime);

  // Create MongoDB document tracking this attachment
  const attachment = await Attachment.create({
    _id,
    userId,
    folderId: folderId || null,
    title: title || 'Untitled File',
    description: '',
    imageUrl: supabaseUrl,
    mimeType: mime,
    // Do not store the huge binary fileData in MongoDB to save database storage
    fileData: undefined, 
  });

  return attachment;
};

/**
 * Bulk-create multiple attachments at once (e.g. multi-file upload)
 */
const createAttachments = async (userId, images, folderId = null) => {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Please provide at least one file');
  }

  const uploadPromises = images.map(async (img) => {
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
    
    const fileExt = mime.split('/').pop() || 'dat';
    const nameSlug = img.title ? img.title.replace(/[^a-zA-Z0-9]/g, '_') : 'upload';
    const fileName = `${nameSlug}_${_id}.${fileExt}`;

    // Upload to Supabase Storage
    const supabaseUrl = await uploadToSupabase(fileBuffer, fileName, mime);

    return {
      _id,
      userId,
      folderId: folderId || null,
      title: img.title || 'Untitled File',
      description: '',
      imageUrl: supabaseUrl,
      mimeType: mime,
      // Do not store the huge binary fileData in MongoDB
      fileData: undefined,
    };
  });

  const docs = await Promise.all(uploadPromises);
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
