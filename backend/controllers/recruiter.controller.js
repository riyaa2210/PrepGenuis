const User = require('../models/User.model');
const Interview = require('../models/Interview.model');
const AppError = require('../utils/AppError');

exports.getCandidates = async (req, res) => {
  const { page = 1, limit = 20, search, minScore, maxScore, sortBy = 'averageScore' } = req.query;
  const skip = (page - 1) * limit;

  const filter = { role: 'candidate' };
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (minScore || maxScore) {
    filter.averageScore = {};
    if (minScore) filter.averageScore.$gte = parseFloat(minScore);
    if (maxScore) filter.averageScore.$lte = parseFloat(maxScore);
  }

  const [candidates, total] = await Promise.all([
    User.find(filter)
      .select('name email avatar totalInterviews averageScore weakTopics createdAt')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, candidates, total, page: parseInt(page), pages: Math.ceil(total / limit) });
};

exports.getCandidateDetail = async (req, res) => {
  const candidate = await User.findById(req.params.id).select('-password -refreshTokens');
  if (!candidate || candidate.role !== 'candidate') throw new AppError('Candidate not found.', 404);

  const interviews = await Interview.find({ candidate: req.params.id, status: 'completed' })
    .select('title round scorecard createdAt duration')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ success: true, candidate, interviews });
};

exports.getCandidateInterviews = async (req, res) => {
  const interviews = await Interview.find({
    candidate: req.params.id,
    status: 'completed',
  })
    .sort({ createdAt: -1 })
    .populate('candidate', 'name email');

  res.json({ success: true, interviews });
};

exports.getAnalytics = async (req, res) => {
  const [totalCandidates, totalInterviews, topCandidates, recentInterviews] = await Promise.all([
    User.countDocuments({ role: 'candidate' }),
    Interview.countDocuments({ status: 'completed' }),
    User.find({ role: 'candidate' })
      .sort({ averageScore: -1 })
      .limit(5)
      .select('name email averageScore totalInterviews'),
    Interview.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('candidate', 'name email'),
  ]);

  // Score distribution
  const scoreDistribution = await Interview.aggregate([
    { $match: { status: 'completed' } },
    {
      $bucket: {
        groupBy: '$scorecard.overallScore',
        boundaries: [0, 3, 5, 7, 9, 11],
        default: 'Other',
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  res.json({
    success: true,
    analytics: {
      totalCandidates,
      totalInterviews,
      topCandidates,
      recentInterviews,
      scoreDistribution,
    },
  });
};
