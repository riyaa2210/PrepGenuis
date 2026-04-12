const fs = require('fs');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume.model');
const User = require('../models/User.model');
const gemini = require('./gemini.service');
const AppError = require('../utils/AppError');

exports.uploadAndParseResume = async ({ userId, file, jobDescription }) => {
  if (!file) throw new AppError('No file uploaded.', 400);

  // Read and parse PDF
  const dataBuffer = fs.readFileSync(file.path);
  const pdfData = await pdfParse(dataBuffer);
  const rawText = pdfData.text;

  if (!rawText || rawText.trim().length < 50) {
    throw new AppError('Could not extract text from PDF. Please ensure it is not scanned.', 400);
  }

  // AI parsing
  const parsed = await gemini.parseResume(rawText);

  // ATS scoring
  const { atsScore, feedback: atsFeedback } = await gemini.generateATSScore({
    resumeText: rawText,
    jobDescription,
  });

  // Extract skill tags
  const skillTags = parsed.skills || [];

  // Upsert resume
  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      originalFileName: file.originalname,
      filePath: file.path,
      rawText,
      parsed,
      skillTags,
      atsScore,
      atsFeedback,
    },
    { upsert: true, new: true }
  );

  // Link resume to user
  await User.findByIdAndUpdate(userId, { resume: resume._id });

  return resume;
};

exports.getResume = async (userId) => {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw new AppError('No resume found. Please upload your resume.', 404);
  return resume;
};

exports.deleteResume = async (userId) => {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw new AppError('No resume found.', 404);

  // Delete file
  if (resume.filePath && fs.existsSync(resume.filePath)) {
    fs.unlinkSync(resume.filePath);
  }

  await resume.deleteOne();
  await User.findByIdAndUpdate(userId, { $unset: { resume: 1 } });
};
