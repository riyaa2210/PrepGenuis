const { generateWithFallback, parseJSON } = require('../config/gemini');
const AppError = require('../utils/AppError');

exports.generateHiringSummary = async ({ candidate, interviews, resume }) => {
  if (!interviews || interviews.length === 0) {
    throw new AppError('No completed interviews found for this candidate.', 400);
  }

  const interviewContext = interviews.map((iv, idx) => {
    const sc = iv.scorecard || {};
    const qaBlock = (iv.answers || [])
      .map((a, i) => `  Q${i + 1}: ${a.question}\n  Answer: ${a.answer || '(no answer)'}\n  Score: ${a.aiEvaluation?.score ?? 'N/A'}/10`)
      .join('\n\n');
    return `--- Interview ${idx + 1}: "${iv.title}" (${iv.round?.toUpperCase()}, ${iv.difficulty}) ---
Overall: ${sc.overallScore ?? 'N/A'}/10 | Technical: ${sc.technicalScore ?? 'N/A'}/10 | Comm: ${sc.communicationScore ?? 'N/A'}/10
Strengths: ${(sc.strengths || []).join('; ') || 'None'}
Improvements: ${(sc.improvements || []).join('; ') || 'None'}
Summary: ${sc.aiSummary || 'N/A'}
Q&A:\n${qaBlock || '  (No answers)'}`;
  }).join('\n\n');

  const resumeContext = resume
    ? `Skills: ${(resume.skillTags || []).join(', ')} | ATS: ${resume.atsScore ?? 'N/A'}/100`
    : 'Resume: Not provided';

  const completedInterviews = interviews.filter((iv) => iv.scorecard?.overallScore != null);
  const avg = (key) => completedInterviews.length > 0
    ? (completedInterviews.reduce((s, iv) => s + (iv.scorecard[key] || 0), 0) / completedInterviews.length).toFixed(1)
    : 'N/A';

  const avgOverall   = avg('overallScore');
  const avgTechnical = avg('technicalScore');
  const avgComm      = avg('communicationScore');

  const prompt = `You are a senior technical recruiter. Produce a STRICT, REALISTIC hiring recommendation.
Base every point on the actual data. Be honest — no generic phrases.

CANDIDATE: ${candidate.name} | Avg: ${avgOverall}/10 | Technical: ${avgTechnical}/10 | Comm: ${avgComm}/10
Weak Topics: ${(candidate.weakTopics || []).join(', ') || 'None'}
${resumeContext}

INTERVIEW DATA:
${interviewContext}

Return ONLY valid JSON:
{
  "strengths": ["<specific strength with evidence>"],
  "weaknesses": ["<specific weakness with evidence>"],
  "communication": "<1-2 sentence assessment>",
  "technical_level": "<Junior | Mid-level | Senior | Not Suitable — with justification>",
  "hire_recommendation": "<YES | NO | MAYBE>",
  "reason": "<2-3 sentences referencing specific scores and patterns>",
  "red_flags": ["<red flag or empty array>"],
  "suggested_follow_up": "<specific topic to test further, or 'None'>"
}`;

  const raw    = await generateWithFallback(prompt);
  const parsed = parseJSON(raw, 'HiringSummary');

  if (parsed.hire_recommendation) {
    parsed.hire_recommendation = parsed.hire_recommendation.toUpperCase().trim();
    if (!['YES', 'NO', 'MAYBE'].includes(parsed.hire_recommendation)) {
      parsed.hire_recommendation = 'MAYBE';
    }
  }

  return {
    ...parsed,
    meta: {
      candidateId:           candidate._id,
      candidateName:         candidate.name,
      interviewsAnalyzed:    interviews.length,
      avgOverallScore:       parseFloat(avgOverall) || 0,
      avgTechnicalScore:     parseFloat(avgTechnical) || 0,
      avgCommunicationScore: parseFloat(avgComm) || 0,
      generatedAt:           new Date().toISOString(),
    },
  };
};
