const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth.middleware');
const upload     = require('../middleware/upload.middleware');

router.use(protect);

// POST /api/resume/upload — multipart/form-data, field: "resume" (PDF)
router.post(
  '/upload',
  (req, res, next) => {
    // Run multer and convert its errors to AppErrors
    upload.single('resume')(req, res, (err) => {
      if (err) {
        const AppError = require('../utils/AppError');
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Max 10MB.', 400));
        }
        return next(err);
      }
      next();
    });
  },
  ctrl.uploadResume
);

router.get('/',    ctrl.getResume);
router.delete('/', ctrl.deleteResume);

module.exports = router;
