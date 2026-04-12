const { generateWithFallback, parseJSONArray } = require('../config/gemini');
const AppError = require('../utils/AppError');

const computeWeightedScore = (c) => {
  const tech = (c.avgTechnicalScore  / 10) * 45;
  const jd   = (c.jdMatchPercent     / 100) * 30;
  const comm = (c.avgCommScore       / 10) * 15;
  const conf = (c.avgConfidenceScore / 10) * 10;
  return Math.round((tech + jd + comm + conf) * 10) / 10;
};

const buildBlock = (c, idx) =>
  `Candidate ${idx + 1}: ${c.name} | Technical: ${c.avgTechnicalScore}/10 | Comm: ${c.avgCommScore}/10 | JD Match: ${c.jdMatchPercent}% | Overall: ${c.avgOverallScore}/10 | Weighted: ${c.weightedScore}/100 | Skills: ${c.skills.join(', ') || 'N/A'} | Weak: ${c.weakTopics.join(', ') || 'None'} | Red Flags: ${c.redFlags.join(', ') || 'None'} | ID: ${c.candidateId}`;

exports.rankCandidates = async ({ candidates, jobDescription }) => {
  if (!candidates || candidates.length === 0) {
    throw new AppError('No candidates provided for ranking.', 400);
  }

  const enriched  = candidates.map((c) => ({ ...c, weightedScore: computeWeightedScore(c) }));
  const preSorted = [...enriched].sort((a, b) => b.weightedScore - a.weightedScore);
  const blocks    = preSorted.map(buildBlock).join('\n');

  const prompt = `You are a senior AI recruiter. Rank these candidates for the job.

PRIORITY: 1. Technical (45%) 2. JD Match (30%) 3. Communication (15%) 4. Confidence (10%)

JOB DESCRIPTION: ${jobDescription || 'General software engineering role'}

CANDIDATES:
${blocks}

Rank ALL ${enriched.length} candidates from best to worst.
Return ONLY a valid JSON array:
[
  {
    "candidate_id": "<exact id>",
    "name": "<name>",
    "rank": <integer from 1>,
    "score": "<weighted>/100",
    "technical_level": "<Junior | Mid-level | Senior | Not Suitable>",
    "hire_recommendation": "<YES | NO | MAYBE>",
    "reason": "<1-2 specific sentences>",
    "key_strengths": ["<strength>"],
    "key_gaps": ["<gap>"]
  }
]`;

  const raw    = await generateWithFallback(prompt);
  let ranked   = parseJSONArray(raw, 'CandidateRanking');

  ranked = ranked.map((r) => {
    const original = enriched.find((c) => c.candidateId === r.candidate_id);
    return {
      ...r,
      hire_recommendation: ['YES','NO','MAYBE'].includes(r.hire_recommendation?.toUpperCase())
        ? r.hire_recommendation.toUpperCase() : 'MAYBE',
      meta: original ? {
        avgTechnicalScore:  original.avgTechnicalScore,
        avgCommScore:       original.avgCommScore,
        avgConfidenceScore: original.avgConfidenceScore,
        avgOverallScore:    original.avgOverallScore,
        jdMatchPercent:     original.jdMatchPercent,
        totalInterviews:    original.totalInterviews,
        weightedScore:      original.weightedScore,
        skills:             original.skills,
        weakTopics:         original.weakTopics,
      } : {},
    };
  });

  ranked.sort((a, b) => a.rank - b.rank);
  ranked.forEach((r, i) => { r.rank = i + 1; });

  return {
    ranked,
    jobDescription: jobDescription || 'General software engineering role',
    totalCandidates: ranked.length,
    generatedAt: new Date().toISOString(),
  };
};
