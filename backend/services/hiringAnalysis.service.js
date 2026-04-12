const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a strict, realistic hiring summary from interview data.
 * Mimics a senior technical recruiter + hiring manager perspective.
 */
exports.generateHiringSummary = async ({ candidate, interviews, resume }) => {
  if (!interviews || interviews.length === 0) {
    throw new AppError('No completed interviews found for this candidate.', 400);
  }

  // ── Build rich context from all completed interviews ──────────────────────
  const interviewContext = interviews.map((iv, idx) => {
    const sc = iv.scorecard || {};
    const qaBlock = (iv.answers || [])
      .map(
        (a, i) =>
          `  Q${i + 1}: ${a.question}\n  Answer: ${a.answer || '(no answer)'}\n  Score: ${a.aiEvaluation?.score ?? 'N/A'}/10\n  AI Feedback: ${a.aiEvaluation?.feedback || 'N/A'}`
      )
      .join('\n\n');

    return `
--- Interview ${idx + 1}: "${iv.title}" (${iv.round?.toUpperCase()} round, ${iv.difficulty} difficulty) ---
Overall Score     : ${sc.overallScore ?? 'N/A'}/10
Technical Score   : ${sc.technicalScore ?? 'N/A'}/10
Communication     : ${sc.communicationScore ?? 'N/A'}/10
Confidence        : ${sc.confidenceScore ?? 'N/A'}/10
Clarity           : ${sc.clarityScore ?? 'N/A'}/10
Filler Words Used : ${(sc.fillerWordsDetected || []).join(', ') || 'None'}
AI Summary        : ${sc.aiSummary || 'N/A'}
Strengths Noted   : ${(sc.strengths || []).join('; ') || 'None'}
Improvements      : ${(sc.improvements || []).join('; ') || 'None'}

Q&A Transcript:
${qaBlock || '  (No answers recorded)'}`;
  }).join('\n\n');

  // ── Resume context ────────────────────────────────────────────────────────
  const resumeContext = resume
    ? `
Candidate Resume:
  Name        : ${resume.parsed?.name || candidate.name}
  Skills      : ${(resume.skillTags || []).join(', ') || 'Not provided'}
  Experience  : ${(resume.parsed?.experience || []).map((e) => `${e.role} at ${e.company} (${e.duration})`).join(' | ') || 'Not provided'}
  Projects    : ${(resume.parsed?.projects || []).map((p) => p.name).join(', ') || 'Not provided'}
  Education   : ${(resume.parsed?.education || []).map((e) => `${e.degree} from ${e.institution}`).join(' | ') || 'Not provided'}
  ATS Score   : ${resume.atsScore ?? 'N/A'}/100`
    : 'Resume: Not provided';

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const completedInterviews = interviews.filter((iv) => iv.scorecard?.overallScore != null);
  const avgOverall =
    completedInterviews.length > 0
      ? (completedInterviews.reduce((s, iv) => s + iv.scorecard.overallScore, 0) / completedInterviews.length).toFixed(1)
      : 'N/A';
  const avgTechnical =
    completedInterviews.length > 0
      ? (completedInterviews.reduce((s, iv) => s + (iv.scorecard.technicalScore || 0), 0) / completedInterviews.length).toFixed(1)
      : 'N/A';
  const avgComm =
    completedInterviews.length > 0
      ? (completedInterviews.reduce((s, iv) => s + (iv.scorecard.communicationScore || 0), 0) / completedInterviews.length).toFixed(1)
      : 'N/A';

  // ── Prompt ────────────────────────────────────────────────────────────────
  const prompt = `
You are a senior technical recruiter and hiring manager at a top-tier tech company (think Google, Meta, or a Series B startup).
You have just reviewed a candidate's complete interview data. Your job is to produce a STRICT, REALISTIC, and SPECIFIC hiring recommendation.

DO NOT be generic. DO NOT use filler phrases like "shows potential" without evidence.
Base every point on the actual answers, scores, and patterns you see in the data.
Be honest — if the candidate is weak, say so clearly. If strong, justify it with specifics.

=== CANDIDATE PROFILE ===
Name            : ${candidate.name}
Email           : ${candidate.email}
Total Interviews: ${interviews.length}
Avg Overall     : ${avgOverall}/10
Avg Technical   : ${avgTechnical}/10
Avg Communication: ${avgComm}/10
Weak Topics     : ${(candidate.weakTopics || []).join(', ') || 'None identified'}

${resumeContext}

=== INTERVIEW DATA ===
${interviewContext}

=== YOUR TASK ===
Analyze ALL the above data and return ONLY a valid JSON object (no markdown, no explanation outside JSON):

{
  "strengths": [
    "<specific strength with evidence from the interview data>",
    "<specific strength>",
    "<specific strength>"
  ],
  "weaknesses": [
    "<specific weakness with evidence>",
    "<specific weakness>",
    "<specific weakness>"
  ],
  "communication": "<1-2 sentence assessment of communication quality — mention filler words, clarity, pace if relevant>",
  "technical_level": "<one of: Junior | Mid-level | Senior | Not Suitable — with a 1-sentence justification>",
  "hire_recommendation": "<YES or NO or MAYBE>",
  "reason": "<2-3 sentences. Be direct. Reference specific scores, answers, or patterns. A real recruiter would write this.>",
  "red_flags": [
    "<any red flag observed, e.g. inconsistency, very low scores on critical topics, excessive filler words, etc.>"
  ],
  "suggested_follow_up": "<If MAYBE or borderline YES — what specific topic or round should be tested further? Otherwise write 'None'>"
}

Rules:
- hire_recommendation must be exactly "YES", "NO", or "MAYBE"
- strengths and weaknesses must each have 2-5 items
- red_flags can be empty array [] if none found
- Every claim must be traceable to the data above
- Do NOT invent information not present in the data
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  // Strip markdown code fences if Gemini wraps in ```json ... ```
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError('AI failed to return valid hiring analysis JSON.', 500);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError('Failed to parse hiring analysis response.', 500);
  }

  // Normalize hire_recommendation to uppercase
  if (parsed.hire_recommendation) {
    parsed.hire_recommendation = parsed.hire_recommendation.toUpperCase().trim();
    if (!['YES', 'NO', 'MAYBE'].includes(parsed.hire_recommendation)) {
      parsed.hire_recommendation = 'MAYBE';
    }
  }

  return {
    ...parsed,
    meta: {
      candidateId: candidate._id,
      candidateName: candidate.name,
      interviewsAnalyzed: interviews.length,
      avgOverallScore: parseFloat(avgOverall) || 0,
      avgTechnicalScore: parseFloat(avgTechnical) || 0,
      avgCommunicationScore: parseFloat(avgComm) || 0,
      generatedAt: new Date().toISOString(),
    },
  };
};
