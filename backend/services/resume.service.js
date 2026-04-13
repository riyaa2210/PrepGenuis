const pdfParse = require('pdf-parse');
const Resume   = require('../models/Resume.model');
const User     = require('../models/User.model');
const gemini   = require('./gemini.service');
const AppError = require('../utils/AppError');
const logger   = require('../config/logger');

exports.uploadAndParseResume = async ({ userId, file, jobDescription }) => {
  if (!file) throw new AppError('No file uploaded.', 400);

  // ── Parse PDF from buffer (memoryStorage — no disk needed) ───────────────
  let rawText;
  try {
    const pdfData = await pdfParse(file.buffer);
    rawText = pdfData.text;
  } catch (err) {
    logger.error(`PDF parse error: ${err.message}`);
    throw new AppError('Failed to read PDF. Make sure it is a valid, non-scanned PDF.', 400);
  }

  if (!rawText || rawText.trim().length < 30) {
    throw new AppError('Could not extract text from PDF. Please ensure it is not a scanned image.', 400);
  }

  // ── AI parsing ────────────────────────────────────────────────────────────
  let parsed;
  try {
    parsed = await gemini.parseResume(rawText);
  } catch (err) {
    logger.error(`Resume AI parse error: ${err.message}`);
    // Fallback — store raw text even if AI fails
    parsed = { skills: [], experience: [], education: [], projects: [], certifications: [] };
  }

  // ── ATS scoring ───────────────────────────────────────────────────────────
  let atsScore = null;
  let atsFeedback = null;
  try {
    const atsResult = await gemini.generateATSScore({
      resumeText: rawText,
      jobDescription,
    });
    atsScore    = atsResult.atsScore;
    atsFeedback = atsResult.feedback;
  } catch (err) {
    logger.warn(`ATS scoring failed (non-fatal): ${err.message}`);
  }

  const skillTags = parsed.skills || [];

  // ── Upsert resume in DB ───────────────────────────────────────────────────
  const resume = await Resume.findOneAndUpdate(
    { user: userId },
    {
      user:             userId,
      originalFileName: file.originalname,
      filePath:         null,          // no disk path with memoryStorage
      rawText,
      parsed,
      skillTags,
      atsScore,
      atsFeedback,
    },
    { upsert: true, new: true }
  );

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
  // No file to delete (memoryStorage — nothing on disk)
  await resume.deleteOne();
  await User.findByIdAndUpdate(userId, { $unset: { resume: 1 } });
};
