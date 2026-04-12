const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Compute a deterministic weighted composite score (0–100) per candidate.
 * Weights: Technical 45% | JD Match 30% | Communication 15% | Confidence 10%
 */
const computeWeightedScore = (candidate) => {
  const tech  = (candidate.avgTechnicalScore  / 10) * 45;
  const jd    = (candidate.jdMatchPercent     / 100) * 30;
  const comm  = (candidate.avgCommScore       / 10) * 15;
  const conf  = (candidate.avgConfidenceScore / 10) * 10;
  return Math.round((tech + jd + comm + conf) * 10) / 10; // one decimal
};

/**
 * Build a compact candidate profile string for the prompt.
 */
const buildCandidateBlock = (c, idx) => `
Candidate ${idx + 1}:
  ID                  : ${c.candidateId}
  Name                : ${c.name}
  Avg Technical Score : ${c.avgTechnicalScore}/10
  Avg Communication   : ${c.avgCommScore}/10
  Avg Confidence      : ${c.avgConfidenceScore}/10
  Avg Overall Score   : ${c.avgOverallScore}/10
  JD Match %          : ${c.jdMatchPercent}%
  Interviews Taken    : ${c.totalInterviews}
  Skills              : ${c.skills.join(', ') || 'N/A'}
  Experience          : ${c.experience || 'N/A'}
  Weak Topics         : ${c.weakTopics.join(', ') || 'None'}
  Red Flags           : ${c.redFlags.join(', ') || 'None'}
  Weighted Score      : ${c.weightedScore}/100`;

/**
 * Main ranking function.
 * @param {Array}  candidates  - enriched candidate objects (see controller)
 * @param {string} jobDescription - the JD text to rank against
 */
exports.rankCandidates = async ({ candidates, jobDescription }) => {
  if (!candidates || candidates.length === 0) {
    throw new AppError('No candidates provided for ranking.', 400);
  }

  // Attach pre-computed weighted scores
  const enriched = candidates.map((c) => ({
    ...c,
    weightedScore: computeWeightedScore(c),
  }));

  // Pre-sort by weighted score so AI has a baseline
  const preSorted = [...enriched].sort((a, b) => b.weightedScore - a.weightedScore);

  const candidateBlocks = preSorted.map(buildCandidateBlock).join('\n');

  const prompt = `
You are a senior AI recruiter at a top-tier tech company.
Your task: rank the following candidates for the given job description.

RANKING PRIORITY (strictly in this order):
  1. Technical ability  (weight: 45%)
  2. JD match %         (weight: 30%)
  3. Communication      (weight: 15%)
  4. Confidence         (weight: 10%)

JOB DESCRIPTION:
${jobDescription || 'General software engineering role — full-stack, problem-solving, system design.'}

CANDIDATES:
${candidateBlocks}

INSTRUCTIONS:
- Rank ALL ${enriched.length} candidates from best (rank 1) to worst.
- Use the weighted scores as a strong signal but apply your own judgment for ties or edge cases.
- The "score" field must be a string like "82.5/100".
- The "reason" must be 1–2 sentences, specific to THIS candidate's data. No generic phrases.
- If two candidates are close, explain the tiebreaker explicitly.
- Penalise candidates with red flags or many weak topics.
- Reward candidates whose skills directly match the JD keywords.

Return ONLY a valid JSON array — no markdown, no explanation outside JSON:
[
  {
    "candidate_id": "<exact id>",
    "name": "<candidate name>",
    "rank": <integer starting at 1>,
    "score": "<weighted_score>/100",
    "technical_level": "<Junior | Mid-level | Senior | Not Suitable>",
    "hire_recommendation": "<YES | NO | MAYBE>",
    "reason": "<specific 1-2 sentence justification>",
    "key_strengths": ["<strength 1>", "<strength 2>"],
    "key_gaps": ["<gap 1>", "<gap 2>"]
  }
]`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new AppError('AI failed to return valid ranking JSON.', 500);

  let ranked;
  try {
    ranked = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError('Failed to parse ranking response.', 500);
  }

  // Normalise & attach meta
  ranked = ranked.map((r) => {
    const original = enriched.find((c) => c.candidateId === r.candidate_id);
    return {
      ...r,
      hire_recommendation: (['YES', 'NO', 'MAYBE'].includes(r.hire_recommendation?.toUpperCase())
        ? r.hire_recommendation.toUpperCase()
        : 'MAYBE'),
      meta: original
        ? {
            avgTechnicalScore:  original.avgTechnicalScore,
            avgCommScore:       original.avgCommScore,
            avgConfidenceScore: original.avgConfidenceScore,
            avgOverallScore:    original.avgOverallScore,
            jdMatchPercent:     original.jdMatchPercent,
            totalInterviews:    original.totalInterviews,
            weightedScore:      original.weightedScore,
            skills:             original.skills,
            weakTopics:         original.weakTopics,
          }
        : {},
    };
  });

  // Guarantee ranks are sequential integers
  ranked.sort((a, b) => a.rank - b.rank);
  ranked.forEach((r, i) => { r.rank = i + 1; });

  return {
    ranked,
    jobDescription: jobDescription || 'General software engineering role',
    totalCandidates: ranked.length,
    generatedAt: new Date().toISOString(),
  };
};
