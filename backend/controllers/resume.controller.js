const resumeService = require('../services/resume.service');
const AppError      = require('../utils/AppError');
const logger        = require('../config/logger');

exports.uploadResume = async (req, res) => {
  // Multer puts file in req.file (memoryStorage → req.file.buffer)
  if (!req.file) {
    throw new AppError('No file received. Send a PDF as multipart/form-data with field name "resume".', 400);
  }

  logger.info(`Resume upload: user=${req.user._id} file=${req.file.originalname} size=${req.file.size}`);

  const { jobDescription } = req.body;

  const resume = await resumeService.uploadAndParseResume({
    userId: req.user._id,
    file:   req.file,
    jobDescription,
  });

  res.status(201).json({ success: true, resume });
};

exports.getResume = async (req, res) => {
  try {
    const resume = await resumeService.getResume(req.user._id);
    res.json({ success: true, resume });
  } catch (err) {
    // Return 404 gracefully — frontend handles "no resume" state
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    throw err;
  }
};

exports.deleteResume = async (req, res) => {
  await resumeService.deleteResume(req.user._id);
  res.json({ success: true, message: 'Resume deleted.' });
};
