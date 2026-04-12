const User      = require('../models/User.model');
const Interview = require('../models/Interview.model');
const Resume    = require('../models/Resume.model');
const rankingService = require('../services/candidateRanking.service');
const AppError  = require('../utils/AppError');

/**
 * Compute JD match % by counting how many JD keywords appear in the candidate's skills.
 */
const computeJDMatch = (skills = [], jd = '') => {
  if (!jd || skills.length === 0) return 0;
  const jdWords = jd.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const jdSet   = new Set(jdWords);
  const matches = skills.filter((s) => jdSet.has(s.toLowerCase().trim()));
  // Score: matched skills / total JD unique words, capped at 100
  const raw = Math.round((matches.length / Math.max(jdSet.size, 1)) * 100 * 3); // ×3 to scale up
  return Math.min(raw, 100);
};

/**
 * POST /api/candidate-ranking
 * Body: { candidateIds: [...], jobDescription: "..." }
 * Recruiter / admin only.
 */
exports.rankCandidates = async (req, res) => {
  const { candidateIds, jobDescription } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length < 2) {
    throw new AppError('Provide at least 2 candidate IDs to rank.', 400);
  }
  if (candidateIds.length > 20) {
    throw new AppError('Maximum 20 candidates per ranking request.', 400);
  }

  // Fetch all candidates in parallel
  const [users, allInterviews, allResumes] = await Promise.all([
    User.find({ _id: { $in: candidateIds }, role: 'candidate' })
        .select('name email weakTopics totalInterviews averageScore'),
    Interview.find({ candidate: { $in: candidateIds }, status: 'completed' }).lean(),
    Resume.find({ user: { $in: candidateIds } }).lean(),
  ]);

  if (users.length === 0) throw new AppError('No valid candidates found.', 404);

  // Build enriched candidate objects
  const enriched = users.map((user) => {
    const interviews = allInterviews.filter(
      (iv) => iv.candidate.toString() === user._id.toString()
    );
    const resume = allResumes.find(
      (r) => r.user.toString() === user._id.toString()
    );

    const completed = interviews.filter((iv) => iv.scorecard?.overallScore != null);
    const avg = (key) =>
      completed.length > 0
        ? Math.round((completed.reduce((s, iv) => s + (iv.scorecard[key] || 0), 0) / completed.length) * 10) / 10
        : 0;

    const skills = resume?.skillTags || [];
    const jdMatchPercent = computeJDMatch(skills, jobDescription);

    // Collect red flags from scorecards
    const redFlags = [];
    completed.forEach((iv) => {
      if ((iv.scorecard?.overallScore || 0) < 4) redFlags.push(`Low score (${iv.scorecard.overallScore}/10) in ${iv.round} round`);
      if ((iv.scorecard?.fillerWordsDetected || []).length > 5) redFlags.push('Excessive filler words');
    });

    const experience = (resume?.parsed?.experience || [])
      .map((e) => `${e.role} at ${e.company}`)
      .slice(0, 2)
      .join(', ');

    return {
      candidateId:        user._id.toString(),
      name:               user.name,
      email:              user.email,
      avgOverallScore:    avg('overallScore'),
      avgTechnicalScore:  avg('technicalScore'),
      avgCommScore:       avg('communicationScore'),
      avgConfidenceScore: avg('confidenceScore'),
      jdMatchPercent,
      totalInterviews:    completed.length,
      skills,
      experience,
      weakTopics:         user.weakTopics || [],
      redFlags:           [...new Set(redFlags)],
    };
  });

  const result = await rankingService.rankCandidates({ candidates: enriched, jobDescription });
  res.json({ success: true, ...result });
};

/**
 * GET /api/candidate-ranking/candidates
 * Returns all candidates with basic stats for the recruiter to select from.
 */
exports.getCandidatePool = async (req, res) => {
  const { search, minScore, limit = 50 } = req.query;

  const filter = { role: 'candidate' };
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (minScore) filter.averageScore = { $gte: parseFloat(minScore) };

  const candidates = await User.find(filter)
    .select('name email totalInterviews averageScore weakTopics createdAt')
    .sort({ averageScore: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, candidates });
};
