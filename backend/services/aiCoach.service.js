const { generateWithFallback, parseJSON } = require('../config/gemini');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────────────────────────────────────
// 6. REAL-TIME FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────
exports.getRealTimeFeedback = async (answerChunk) => {
  if (!answerChunk?.trim()) return { feedback: 'Keep going…', type: 'neutral' };

  const prompt = `You are a real-time interview coach.
Analyze this partial answer: "${answerChunk}"

Rules:
- Return ONLY one short feedback sentence (max 10 words).
- Be direct and actionable.
- Choose from these types: clarity | filler | example | pace | vague | good | concise

Respond in this exact JSON format:
{"feedback": "<one sentence>", "type": "<type>"}`;

  try {
    const raw = await generateWithFallback(prompt);
    const parsed = parseJSON(raw, 'RealTimeFeedback');
    return {
      feedback: parsed.feedback || 'Keep going…',
      type:     parsed.type    || 'neutral',
    };
  } catch {
    return { feedback: 'Keep going…', type: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. LEARNING ROADMAP
// ─────────────────────────────────────────────────────────────────────────────
exports.generateLearningRoadmap = async ({ weakAreas, interviewHistory, role, targetDays = 14 }) => {
  if (!weakAreas || weakAreas.length === 0) {
    throw new AppError('Weak areas are required to generate a roadmap.', 400);
  }

  const historyBlock = interviewHistory?.length
    ? interviewHistory.slice(-5).map((iv, i) =>
        `Interview ${i + 1} (${iv.round}): Overall ${iv.scorecard?.overallScore ?? 'N/A'}/10 — ${iv.scorecard?.aiSummary || 'No summary'}`
      ).join('\n')
    : 'No prior interview history.';

  const prompt = `You are an expert career coach and technical mentor.

TARGET ROLE: ${role || 'Software Engineer'}
WEAK AREAS: ${weakAreas.join(', ')}
TARGET DAYS: ${targetDays}

RECENT INTERVIEW PERFORMANCE:
${historyBlock}

Generate a practical learning roadmap. Each topic must have specific tasks.
Resources must be real (LeetCode, NeetCode, System Design Primer, etc.).

Return ONLY valid JSON:
{
  "weak_areas": ["<area>"],
  "target_role": "${role || 'Software Engineer'}",
  "total_days": ${targetDays},
  "roadmap": [
    {
      "topic": "<topic name>",
      "priority": "<High | Medium | Low>",
      "duration": "<e.g. Day 1-3>",
      "goal": "<what the candidate should achieve>",
      "tasks": ["<specific task>"],
      "daily_time_commitment": "<e.g. 2 hours/day>"
    }
  ],
  "resources": [
    {
      "name": "<resource name>",
      "url": "<url or platform>",
      "type": "<Video | Article | Practice | Book>",
      "covers": "<which weak area>"
    }
  ],
  "milestones": [
    { "day": <number>, "checkpoint": "<what should be achieved>" }
  ],
  "coach_note": "<1-2 sentence motivational note>"
}`;

  const raw = await generateWithFallback(prompt);
  return parseJSON(raw, 'LearningRoadmap');
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. MULTI-ROUND INTERVIEW GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const ROUND_RULES = {
  hr:         { focus: 'behavioral, cultural fit, motivation, conflict resolution', style: 'STAR-method questions', avoid: 'technical or coding questions' },
  technical:  { focus: 'DSA, system design, coding patterns, time/space complexity', style: 'problem-solving questions', avoid: 'purely behavioral questions' },
  managerial: { focus: 'leadership, decision-making, team management, strategy', style: 'scenario-based questions', avoid: 'low-level coding questions' },
};

exports.generateMultiRoundQuestions = async ({ roundType, resume, previousAnswers, jobDescription, count = 5 }) => {
  const round = roundType?.toLowerCase() || 'technical';
  const rules = ROUND_RULES[round] || ROUND_RULES.technical;

  const resumeBlock = resume
    ? `Skills: ${(resume.skillTags || []).join(', ')}\nExperience: ${(resume.parsed?.experience || []).map((e) => `${e.role} at ${e.company}`).join(' | ')}`
    : 'Resume not provided.';

  const prevBlock = previousAnswers?.length
    ? previousAnswers.slice(-3).map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer || '(no answer)'}\nScore: ${a.aiEvaluation?.score ?? 'N/A'}/10`).join('\n\n')
    : 'No previous answers.';

  const prompt = `You are a senior interviewer conducting a ${round.toUpperCase()} round.

FOCUS: ${rules.focus}
STYLE: ${rules.style}
AVOID: ${rules.avoid}

CANDIDATE RESUME: ${resumeBlock}
JOB DESCRIPTION: ${jobDescription || 'General software engineering role'}
PREVIOUS ANSWERS: ${prevBlock}

Generate exactly ${count} questions. Vary difficulty. Do NOT repeat covered topics.

Return ONLY valid JSON:
{
  "round_type": "${round}",
  "questions": [
    {
      "id": "<string>",
      "text": "<question>",
      "category": "<category>",
      "difficulty": "<Easy | Medium | Hard>",
      "why_asked": "<1 sentence>",
      "expected_keywords": ["<keyword>"],
      "follow_up": "<optional follow-up>"
    }
  ],
  "round_strategy": "<1-2 sentence note>"
}`;

  const raw = await generateWithFallback(prompt);
  return parseJSON(raw, 'MultiRound');
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. MEMORY-BASED RAG INTERVIEWER
// ─────────────────────────────────────────────────────────────────────────────
exports.generateMemoryBasedInterview = async ({ previousInterviews, interviewMemory, resume, currentPerformance, jobDescription, count = 5 }) => {
  const memorySummary = previousInterviews?.length
    ? previousInterviews.slice(-5).map((iv) =>
        `[${iv.round?.toUpperCase()}] Overall: ${iv.scorecard?.overallScore ?? 'N/A'}/10 | Weak: ${iv.scorecard?.improvements?.join(', ') || 'N/A'} | Summary: ${iv.scorecard?.aiSummary || 'N/A'}`
      ).join('\n')
    : 'No previous interview history.';

  const memoryTags = interviewMemory?.length
    ? interviewMemory.slice(-10).map((m) => `- ${m.topic}: ${m.performance} (${m.notes || 'no notes'})`).join('\n')
    : 'No memory tags.';

  const resumeBlock = resume
    ? `Skills: ${(resume.skillTags || []).join(', ')}\nExperience: ${(resume.parsed?.experience || []).map((e) => `${e.role} at ${e.company}`).join(' | ')}`
    : 'Resume not provided.';

  const prompt = `You are an AI interviewer with persistent memory across all past sessions.

CANDIDATE RESUME: ${resumeBlock}
JOB DESCRIPTION: ${jobDescription || 'General software engineering role'}
PAST INTERVIEWS: ${memorySummary}
AI MEMORY TAGS: ${memoryTags}
CURRENT SESSION: ${currentPerformance ? `Avg score: ${currentPerformance.avgScore}/10` : 'No data'}

Generate ${count} personalized questions that revisit past weak areas.
Write memory_feedback referencing specific past struggles.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "<string>",
      "text": "<question>",
      "category": "<category>",
      "difficulty": "<Easy | Medium | Hard>",
      "memory_reference": "<why this question>",
      "expected_keywords": ["<keyword>"]
    }
  ],
  "memory_feedback": "<personalized message referencing past struggles>",
  "focus_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "session_strategy": "<how today is tailored based on memory>",
  "encouragement": "<1 sentence acknowledging effort>"
}`;

  const raw = await generateWithFallback(prompt);
  return parseJSON(raw, 'MemoryRAG');
};
