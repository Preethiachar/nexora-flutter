const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(path.join(__dirname, '../uploads/documents'));
ensureDir(path.join(__dirname, '../uploads/images'));
ensureDir(path.join(__dirname, '../uploads/resumes'));

// ─── Document Storage (Word, PDF, PowerPoint) ─────────────────────────────────
const documentStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

const documentFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_DOC_TYPES.includes(file.mimetype) || ALLOWED_DOC_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word (.doc, .docx), and PowerPoint (.ppt, .pptx) files are allowed'), false);
  }
};

// ─── Image Storage (Avatars & Photos) ─────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/images'));
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// ─── Resume PDF Storage ───────────────────────────────────────────────────────
const resumeStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const resumeFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF (.pdf) resume files are allowed'), false);
  }
};

// ─── Helper: determine file type category ────────────────────────────────────
const getFileType = (mimetype, filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (mimetype === 'application/pdf' || ext === '.pdf') return 'pdf';
  if (mimetype === 'application/msword' || ['.doc', '.docx'].includes(ext)) return 'word';
  if (
    mimetype === 'application/vnd.ms-powerpoint' ||
    ['.ppt', '.pptx'].includes(ext)
  ) return 'ppt';
  if (mimetype.startsWith('image/')) return 'image';
  return 'other';
};

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { uploadDocument, uploadImage, uploadResume, getFileType };
