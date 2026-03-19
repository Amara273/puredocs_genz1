// services/storageService.js
// Handles file storage — switches between Cloudinary (cloud) and local disk
// Set STORAGE_MODE=cloudinary or STORAGE_MODE=local in .env

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MODE    = (process.env.STORAGE_MODE || 'local').toLowerCase();
const MAX_MB  = parseInt(process.env.MAX_FILE_SIZE_MB) || 50;

// ── Allowed file types ────────────────────────────────
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain','text/csv','text/markdown',
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'application/zip','application/x-rar-compressed',
  'video/mp4','video/webm',
  'audio/mpeg','audio/wav',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត: ${file.mimetype}`), false);
};

// ════════════════════════════════════════════════════
// CLOUDINARY MODE
// ════════════════════════════════════════════════════
function buildCloudinaryUploader() {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const teamId = req.body.teamId || 'general';
      const ext    = path.extname(file.originalname).replace('.','');
      // Use 'raw' resource type for non-image files so Cloudinary stores them as-is
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder:        `teamdocs/${teamId}`,
        public_id:     uuidv4(),
        resource_type: isImage ? 'image' : isVideo ? 'video' : 'raw',
        format:        isImage || isVideo ? undefined : ext || undefined,
      };
    },
  });

  const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_MB * 1024 * 1024 } });

  // Helper: delete a file from Cloudinary
  async function deleteFile(storedName, mimetype) {
    try {
      const isImage = (mimetype||'').startsWith('image/');
      const isVideo = (mimetype||'').startsWith('video/');
      const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';
      await cloudinary.uploader.destroy(storedName, { resource_type: resourceType });
      return true;
    } catch(e) {
      console.error('Cloudinary delete error:', e.message);
      return false;
    }
  }

  // Helper: get download URL
  function getFileUrl(file) {
    // filepath stores the Cloudinary secure_url when using cloudinary mode
    return file.filepath;
  }

  // Helper: get viewing URL (same as download for Cloudinary)
  function getViewUrl(file) {
    return file.filepath;
  }

  // Helper: delete folder contents from Cloudinary
  async function deleteFolderFiles(teamId, files) {
    for (const file of files) {
      await deleteFile(file.stored_name, file.mimetype);
    }
  }

  return { upload, deleteFile, getFileUrl, getViewUrl, deleteFolderFiles, mode: 'cloudinary' };
}

// ════════════════════════════════════════════════════
// LOCAL DISK MODE
// ════════════════════════════════════════════════════
function buildLocalUploader() {
  const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const teamId  = req.body.teamId || 'general';
      const teamDir = path.join(UPLOAD_DIR, teamId);
      fs.mkdirSync(teamDir, { recursive: true });
      cb(null, teamDir);
    },
    filename: (req, file, cb) => {
      cb(null, uuidv4() + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_MB * 1024 * 1024 } });

  function deleteFile(filepath) {
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); return true; }
    catch(e) { return false; }
  }

  function getFileUrl(file) { return file.filepath; }
  function getViewUrl(file) { return file.filepath; }

  async function deleteFolderFiles(teamId, files) {
    for (const file of files) deleteFile(file.filepath);
  }

  return { upload, deleteFile, getFileUrl, getViewUrl, deleteFolderFiles, mode: 'local' };
}

// ════════════════════════════════════════════════════
// ERROR HANDLER (same for both modes)
// ════════════════════════════════════════════════════
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: `ឯកសារធំពេក (max ${MAX_MB}MB)` });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
}

// ════════════════════════════════════════════════════
// EXPORT — auto-selects mode based on .env
// ════════════════════════════════════════════════════
let storage;
if (MODE === 'cloudinary') {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️  STORAGE_MODE=cloudinary but credentials missing — falling back to local');
    storage = buildLocalUploader();
  } else {
    storage = buildCloudinaryUploader();
    console.log('☁️  Storage: Cloudinary');
  }
} else {
  storage = buildLocalUploader();
  console.log('💾  Storage: Local disk');
}

module.exports = { ...storage, handleUploadError };