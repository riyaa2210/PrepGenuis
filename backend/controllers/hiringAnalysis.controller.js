const User = require('../models/User.model');
const Interview = require('../models/Interview.model');
const Resume = require('../models/Resume.model');
const hiringService = require('../services/hiringAnalysis.service');
const AppError = require('../utils/AppError');

/**
 * POST /api/hiring-analysis/:candidateId
 * Recruiter or admin generates a hiring summary for a candidate.
 */
exports.analyzeCandidate = async (req, res) => {
  const { candidateId } = req.params;

  const candidate = await User.findById(candidateId).select(
    'name email role totalInterviews averageScore weakTopics'
  );
  if (!candidate || candidate.role !== 'candidate') {
    throw new AppError('Candidate not found.', 404);
  }

  const [interviews, resume] = await Promise.all([
    Interview.find({ candidate: candidateId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5) // analyse last 5 interviews max
      .lean(),
    Resume.findOne({ user: candidateId }).lean(),
  ]);

  const summary = await hiringService.generateHiringSummary({
    candidate,
    interviews,
    resume,
  });

  res.json({ success: true, summary });
};

/**
 * POST /api/hiring-analysis/self
 * Candidate analyses their own performance (self-review mode).
 */
exports.analyzeSelf = async (req, res) => {
  const userId = req.user._id;

  const [interviews, resume] = await Promise.all([
    Interview.find({ candidate: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Resume.findOne({ user: userId }).lean(),
  ]);

  const summary = await hiringService.generateHiringSummary({
    candidate: req.user,
    interviews,
    resume,
  });

  res.json({ success: true, summary });
};
