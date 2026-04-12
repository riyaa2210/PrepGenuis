const aiCoach   = require('../services/aiCoach.service');
const Interview = require('../models/Interview.model');
const Resume    = require('../models/Resume.model');
const User      = require('../models/User.model');
const AppError  = require('../utils/AppError');

// ── 6. Real-Time Feedback ─────────────────────────────────────────────────────
exports.realTimeFeedback = async (req, res) => {
  const { answerChunk } = req.body;
  if (!answerChunk?.trim()) throw new AppError('answerChunk is required.', 400);
  const result = await aiCoach.getRealTimeFeedback(answerChunk);
  res.json({ success: true, ...result });
};

// ── 8. Learning Roadmap ───────────────────────────────────────────────────────
exports.learningRoadmap = async (req, res) => {
  const { weakAreas, role, targetDays } = req.body;
  const userId = req.user._id;

  // Pull weak areas from user profile if not provided
  let resolvedWeakAreas = weakAreas;
  if (!resolvedWeakAreas || resolvedWeakAreas.length === 0) {
    const user = await User.findById(userId).select('weakTopics');
    resolvedWeakAreas = user?.weakTopics || [];
  }
  if (!resolvedWeakAreas || resolvedWeakAreas.length === 0) {
    throw new AppError('No weak areas found. Complete at least one interview first.', 400);
  }

  // Pull recent interview history for context
  const interviewHistory = await Interview.find({ candidate: userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('round scorecard createdAt')
    .lean();

  const roadmap = await aiCoach.generateLearningRoadmap({
    weakAreas: resolvedWeakAreas,
    interviewHistory,
    role,
    targetDays: targetDays || 14,
  });

  res.json({ success: true, roadmap });
};

// ── 9. Multi-Round Interview ──────────────────────────────────────────────────
exports.multiRoundInterview = async (req, res) => {
  const { roundType, jobDescription, count, interviewId } = req.body;
  const userId = req.user._id;

  const [resume, previousAnswers] = await Promise.all([
    Resume.findOne({ user: userId }).lean(),
    interviewId
      ? Interview.findOne({ _id: interviewId, candidate: userId })
          .select('answers')
          .lean()
          .then((iv) => iv?.answers || [])
      : Promise.resolve([]),
  ]);

  const result = await aiCoach.generateMultiRoundQuestions({
    roundType,
    resume,
    previousAnswers,
    jobDescription,
    count: count || 5,
  });

  res.json({ success: true, ...result });
};

// ── 10. Memory-Based RAG Interview ───────────────────────────────────────────
exports.memoryInterview = async (req, res) => {
  const { jobDescription, count, currentPerformance } = req.body;
  const userId = req.user._id;

  const [user, previousInterviews, resume] = await Promise.all([
    User.findById(userId).select('interviewMemory weakTopics').lean(),
    Interview.find({ candidate: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('round scorecard createdAt answers')
      .lean(),
    Resume.findOne({ user: userId }).lean(),
  ]);

  const result = await aiCoach.generateMemoryBasedInterview({
    previousInterviews,
    interviewMemory: user?.interviewMemory || [],
    resume,
    currentPerformance,
    jobDescription,
    count: count || 5,
  });

  res.json({ success: true, ...result });
};
