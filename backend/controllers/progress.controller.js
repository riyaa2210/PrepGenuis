const Interview = require('../models/Interview.model');
const User = require('../models/User.model');

exports.getProgress = async (req, res) => {
  const userId = req.user._id;

  const interviews = await Interview.find({ candidate: userId, status: 'completed' })
    .sort({ createdAt: 1 })
    .select('scorecard round createdAt title');

  const user = await User.findById(userId).select('weakTopics interviewMemory averageScore totalInterviews');

  // Build improvement graph data
  const graphData = interviews.map((iv) => ({
    date: iv.createdAt,
    title: iv.title,
    round: iv.round,
    overallScore: iv.scorecard?.overallScore || 0,
    technicalScore: iv.scorecard?.technicalScore || 0,
    communicationScore: iv.scorecard?.communicationScore || 0,
  }));

  // Round breakdown
  const roundBreakdown = {};
  interviews.forEach((iv) => {
    if (!roundBreakdown[iv.round]) roundBreakdown[iv.round] = { count: 0, totalScore: 0 };
    roundBreakdown[iv.round].count++;
    roundBreakdown[iv.round].totalScore += iv.scorecard?.overallScore || 0;
  });
  Object.keys(roundBreakdown).forEach((r) => {
    roundBreakdown[r].avgScore =
      Math.round((roundBreakdown[r].totalScore / roundBreakdown[r].count) * 10) / 10;
  });

  res.json({
    success: true,
    progress: {
      totalInterviews: user.totalInterviews,
      averageScore: user.averageScore,
      weakTopics: user.weakTopics,
      interviewMemory: user.interviewMemory,
      graphData,
      roundBreakdown,
    },
  });
};
