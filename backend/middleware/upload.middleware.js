const multer  = require('multer');
const AppError = require('../utils/AppError');

// ── Use memoryStorage — works on Render (no persistent filesystem) ────────────
// File is available as req.file.buffer instead of req.file.path
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

module.exports = upload;
