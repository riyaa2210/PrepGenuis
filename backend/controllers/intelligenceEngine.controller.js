const engine   = require('../services/intelligenceEngine.service');
const Resume   = require('../models/Resume.model');
const Interview = require('../models/Interview.model');
const AppError = require('../utils/AppError');

// ── 1. ATS Analysis ───────────────────────────────────────────────────────────
exports.analyzeATS = async (req, res) => {
  const { jobDescription, resumeText, skills } = req.body;

  // If no manual input, pull from user's stored resume
  let resolvedText = resumeText;
  let resolvedSkills = skills;

  if (!resolvedText && !resolvedSkills) {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) throw new AppError('No resume found. Upload your resume or provide text.', 404);
    resolvedText   = resume.rawText;
    resolvedSkills = resume.skillTags;
  }

  const result = await engine.analyzeATS({
    resumeText:     resolvedText,
    skills:         resolvedSkills,
    jobDescription,
  });

  res.json({ success: true, ats: result });
};

// ── 2. Speech Analysis ────────────────────────────────────────────────────────
exports.analyzeSpeech = async (req, res) => {
  const { transcript, durationSeconds, questionContext, interviewId, answerId } = req.body;

  if (!transcript?.trim()) throw new AppError('Transcript is required.', 400);

  // Optionally enrich context from stored interview
  let context = questionContext;
  if (!context && interviewId && answerId) {
    const interview = await Interview.findOne({ _id: interviewId, candidate: req.user._id });
    if (interview) {
      const answer = interview.answers.id(answerId);
      if (answer) context = answer.question;
    }
  }

  const result = await engine.analyzeSpeech({ transcript, durationSeconds, questionContext: context });
  res.json({ success: true, speech: result });
};

// ── 3. Behavioral Analysis ────────────────────────────────────────────────────
exports.analyzeBehavior = async (req, res) => {
  const {
    eyeContactPercent,
    facialEmotions,
    headMovementData,
    durationSeconds,
  } = req.body;

  if (eyeContactPercent === undefined || eyeContactPercent === null) {
    throw new AppError('eyeContactPercent is required.', 400);
  }

  const result = await engine.analyzeBehavior({
    eyeContactPercent,
    facialEmotions:   facialEmotions   || { confident: 50, nervous: 20, neutral: 25, happy: 5 },
    headMovementData: headMovementData || { stable: 70, nodding: 20, excessive: 10 },
    durationSeconds,
    candidateName: req.user.name,
  });

  res.json({ success: true, behavior: result });
};

// ── 4. Full Interview Intelligence (all three combined) ───────────────────────
exports.analyzeFullInterview = async (req, res) => {
  const {
    jobDescription,
    transcript,
    durationSeconds,
    eyeContactPercent,
    facialEmotions,
    headMovementData,
    questionContext,
  } = req.body;

  const resume = await Resume.findOne({ user: req.user._id });

  const [ats, speech, behavior] = await Promise.all([
    jobDescription
      ? engine.analyzeATS({
          resumeText: resume?.rawText,
          skills:     resume?.skillTags,
          jobDescription,
        })
      : Promise.resolve(null),

    transcript?.trim()
      ? engine.analyzeSpeech({ transcript, durationSeconds, questionContext })
      : Promise.resolve(null),

    eyeContactPercent !== undefined
      ? engine.analyzeBehavior({
          eyeContactPercent,
          facialEmotions,
          headMovementData,
          durationSeconds,
          candidateName: req.user.name,
        })
      : Promise.resolve(null),
  ]);

  res.json({ success: true, ats, speech, behavior, analyzedAt: new Date().toISOString() });
};
