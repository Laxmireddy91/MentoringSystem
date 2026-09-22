const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

// ─── Ensure upload directories exist ────────────────────────────────────────
const UPLOAD_DIRS = {
  achievements: path.join(__dirname, '../uploads/achievements'),
  documents: path.join(__dirname, '../uploads/documents'),
  imports: path.join(__dirname, '../uploads/imports'),
};
Object.values(UPLOAD_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Shared filename generator ───────────────────────────────────────────────
function makeFilename(file, cb) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname).toLowerCase();
  const sanitizedBase = path
    .basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
}

// ─── Storage factory ──────────────────────────────────────────────────────────
function diskStorage(destDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destDir),
    filename: (_req, file, cb) => makeFilename(file, cb),
  });
}

// ─── File filters ─────────────────────────────────────────────────────────────
const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_IMPORT_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel', // .xls (legacy)
];

const ALL_ALLOWED_MIMES = [...ALLOWED_DOCUMENT_MIMES, ...ALLOWED_IMPORT_MIMES];

function makeFilter(allowedMimes) {
  return (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Unsupported file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`,
          400
        ),
        false
      );
    }
  };
}

// ─── Configured multer instances ──────────────────────────────────────────────

/**
 * upload — legacy/achievement uploads (PDF, image, xlsx, csv)
 * Used by achievement upload and any existing routes that import upload directly.
 */
const upload = multer({
  storage: diskStorage(UPLOAD_DIRS.achievements),
  fileFilter: makeFilter(ALL_ALLOWED_MIMES),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5,
  },
});

/**
 * documentUpload — Document Vault uploads (PDF and images only)
 * Stored in uploads/documents. Served only via authenticated API — never publicly.
 */
const documentUpload = multer({
  storage: diskStorage(UPLOAD_DIRS.documents),
  fileFilter: makeFilter(ALLOWED_DOCUMENT_MIMES),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
    files: 1,
  },
});

/**
 * importUpload — HOD Excel/CSV imports (xlsx and csv only)
 * Stored in uploads/imports (temp). Deleted after preview or confirm step.
 */
const importUpload = multer({
  storage: diskStorage(UPLOAD_DIRS.imports),
  fileFilter: makeFilter(ALLOWED_IMPORT_MIMES),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

module.exports = upload;
module.exports.documentUpload = documentUpload;
module.exports.importUpload = importUpload;
