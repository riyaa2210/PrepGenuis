const resumeService = require('../services/resume.service');

exports.uploadResume = async (req, res) => {
  const { jobDescription } = req.body;
  const resume = await resumeService.uploadAndParseResume({
    userId: req.user._id,
    file: req.file,
    jobDescription,
  });
  res.status(201).json({ success: true, resume });
};

exports.getResume = async (req, res) => {
  const resume = await resumeService.getResume(req.user._id);
  res.json({ success: true, resume });
};

exports.deleteResume = async (req, res) => {
  await resumeService.deleteResume(req.user._id);
  res.json({ success: true, message: 'Resume deleted.' });
};
