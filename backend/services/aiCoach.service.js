const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const parseJSON = (raw, label) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError(`AI returned invalid JSON for ${label}.`, 500);
  try { return JSON.parse(match[0]); }
  catch { throw new AppError(`Failed to parse ${label} response.`, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. REAL-TIME FEEDBACK  (single line, <50ms target)
// ─────────────────────────────────────────────────────────────────────────────
exports.getRealTimeFeedback = async (answerChunk) => {
  if (!answerChunk?.trim()) return { feedback: 'Keep going…', type: 'neutral' };

  const prompt = `You are a real-time interview coach.
Analyze this partial answer: "${answerChunk}"

Rules:
- Return ONLY one short feedback sentence (max 10 words).
- Be direct and actionable.
- Choose from these types: clarity | filler | example | pace | vague | good | concise
- Examples: "Avoid filler words", "Add a concrete example", "Be more concise", "Too vague — add specifics", "Good structure, keep going"

Respond in this exact JSON format:
{"feedback": "<one sentence>", "type": "<type>"}`;

  const result = await model().generateContent(prompt);
  const raw    = result.response.text();
  const match  = raw.match(/\{[\s\S]*?\}/);
  if (!match) return { feedback: 'Keep going…', type: 'neutral' };
  try {
    const parsed = JSON.parse(match[0]);
    return {
      feedback: parsed.feedback || 'Keep going…',
      type:     parsed.type    || 'neutral',
    };
  } catch {
    return { feedback: 'Keep going…', type: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. LEARNING ROADMAP  (7–14 day structured plan)
// ─────────────────────────────────────────────────────────────────────────────
exports.generateLearningRoadmap = async ({ weakAreas, interviewHistory, role, targetDays = 14 }) => {
  if (!weakAreas || weakAreas.length === 0) {
    throw new AppError('Weak areas are required to generate a roadmap.', 400);
  }

  const historyBlock = interviewHistory?.length
    ? interviewHistory
        .slice(-5)
        .map((iv, i) =>
          `Interview ${i + 1} (${iv.round}): Overall ${iv.scorecard?.overallScore ?? 'N/A'}/10 — ${iv.scorecard?.aiSummary || 'No summary'}`
        )
        .join('\n')
    : 'No prior interview history.';

  const prompt = `You are an expert career coach and technical mentor.

TARGET ROLE: ${role || 'Software Engineer'}
WEAK AREAS: ${weakAreas.join(', ')}
TARGET DAYS: ${targetDays}

RECENT INTERVIEW PERFORMANCE:
${historyBlock}

Generate a practical, day-by-day learning roadmap to address the weak areas.
Each topic must have specific tasks (not generic advice).
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
      "tasks": [
        "<specific task with action verb>"
      ],
      "daily_time_commitment": "<e.g. 2 hours/day>"
    }
  ],
  "resources": [
    {
      "name": "<resource name>",
      "url": "<url or platform>",
      "type": "<Video | Article | Practice | Book>",
      "covers": "<which weak area it addresses>"
    }
  ],
  "milestones": [
    {
      "day": <day number>,
      "checkpoint": "<what should be achieved by this day>"
    }
  ],
  "coach_note": "<1-2 sentence motivational note specific to these weak areas>"
}`;

  const result = await model().generateContent(prompt);
  return parseJSON(result.response.text(), 'LearningRoadmap');
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. MULTI-ROUND INTERVIEW GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const ROUND_RULES = {
  hr: {
    focus: 'behavioral, cultural fit, motivation, conflict resolution, teamwork',
    style: 'STAR-method questions (Situation, Task, Action, Result)',
    avoid: 'technical or coding questions',
  },
  technical: {
    focus: 'DSA, system design, coding patterns, time/space complexity, architecture',
    style: 'problem-solving questions with expected approach hints',
    avoid: 'purely behavioral questions',
  },
  managerial: {
    focus: 'leadership, decision-making under pressure, team management, strategy, stakeholder communication',
    style: 'scenario-based questions requiring judgment calls',
    avoid: 'low-level coding or purely personal questions',
  },
};

exports.generateMultiRoundQuestions = async ({
  roundType,
  resume,
  previousAnswers,
  jobDescription,
  count = 5,
}) => {
  const round = roundType?.toLowerCase() || 'technical';
  const rules = ROUND_RULES[round] || ROUND_RULES.technical;

  const resumeBlock = resume
    ? `Skills: ${(resume.skillTags || []).join(', ')}
Experience: ${(resume.parsed?.experience || []).map((e) => `${e.role} at ${e.company}`).join(' | ')}
Projects: ${(resume.parsed?.projects || []).map((p) => p.name).join(', ')}`
    : 'Resume not provided.';

  const prevBlock = previousAnswers?.length
    ? previousAnswers
        .slice(-3)
        .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer || '(no answer)'}\nScore: ${a.aiEvaluation?.score ?? 'N/A'}/10`)
        .join('\n\n')
    : 'No previous answers in this session.';

  const prompt = `You are a senior interviewer conducting a ${round.toUpperCase()} round interview.

ROUND RULES:
- Focus on: ${rules.focus}
- Question style: ${rules.style}
- Avoid: ${rules.avoid}

CANDIDATE RESUME:
${resumeBlock}

JOB DESCRIPTION:
${jobDescription || 'General software engineering role'}

PREVIOUS ANSWERS THIS SESSION:
${prevBlock}

Generate exactly ${count} questions for this ${round.toUpperCase()} round.
- Questions must be personalized to the resume and JD.
- Do NOT repeat topics already covered in previous answers.
- Vary difficulty: mix easy, medium, hard.
- For technical: include at least 1 system design question if count >= 4.
- For HR: use real-world scenarios, not hypotheticals.
- For managerial: include at least 1 conflict resolution scenario.

Return ONLY valid JSON:
{
  "round_type": "${round}",
  "questions": [
    {
      "id": "<uuid-style string>",
      "text": "<full question text>",
      "category": "<e.g. System Design | Behavioral | DSA | Leadership>",
      "difficulty": "<Easy | Medium | Hard>",
      "why_asked": "<1 sentence: what this question tests>",
      "expected_keywords": ["<keyword>"],
      "follow_up": "<optional follow-up question if candidate answers well>"
    }
  ],
  "round_strategy": "<1-2 sentence note on what this round is designed to assess>"
}`;

  const result = await model().generateContent(prompt);
  return parseJSON(result.response.text(), 'MultiRound');
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. MEMORY-BASED RAG INTERVIEWER
// ─────────────────────────────────────────────────────────────────────────────
exports.generateMemoryBasedInterview = async ({
  previousInterviews,
  interviewMemory,
  resume,
  currentPerformance,
  jobDescription,
  count = 5,
}) => {
  // Build memory summary from past interviews
  const memorySummary = previousInterviews?.length
    ? previousInterviews
        .slice(-5)
        .map((iv) => {
          const weak = iv.scorecard?.improvements?.join(', ') || 'N/A';
          const strong = iv.scorecard?.strengths?.join(', ') || 'N/A';
          return `[${iv.round?.toUpperCase()} — ${new Date(iv.createdAt).toLocaleDateString()}]
  Overall: ${iv.scorecard?.overallScore ?? 'N/A'}/10
  Strong: ${strong}
  Weak: ${weak}
  Summary: ${iv.scorecard?.aiSummary || 'N/A'}`;
        })
        .join('\n\n')
    : 'No previous interview history.';

  // AI memory tags (stored on user model)
  const memoryTags = interviewMemory?.length
    ? interviewMemory
        .slice(-10)
        .map((m) => `- ${m.topic}: ${m.performance} (${m.notes || 'no notes'})`)
        .join('\n')
    : 'No memory tags.';

  const resumeBlock = resume
    ? `Skills: ${(resume.skillTags || []).join(', ')}
Experience: ${(resume.parsed?.experience || []).map((e) => `${e.role} at ${e.company}`).join(' | ')}`
    : 'Resume not provided.';

  const currentBlock = currentPerformance
    ? `Current session avg score: ${currentPerformance.avgScore ?? 'N/A'}/10
Topics covered so far: ${currentPerformance.topicsCovered?.join(', ') || 'None'}`
    : 'No current session data.';

  const prompt = `You are an AI interviewer with persistent memory across all past sessions.
You remember every interview this candidate has done and use that context to personalize today's session.

CANDIDATE RESUME:
${resumeBlock}

JOB DESCRIPTION:
${jobDescription || 'General software engineering role'}

PAST INTERVIEW HISTORY (last 5):
${memorySummary}

AI MEMORY TAGS:
${memoryTags}

CURRENT SESSION PERFORMANCE:
${currentBlock}

YOUR TASK:
1. Generate ${count} personalized questions that:
   - Revisit topics the candidate previously struggled with
   - Build on strengths to go deeper
   - Avoid repeating questions already asked this session
   - Reference past mistakes naturally (like a human interviewer would)

2. Write memory_feedback that sounds like a real interviewer who remembers the candidate.
   Example: "Last time you struggled with recursion — let's revisit that today."

3. Identify focus_areas: the 2-3 most important topics to address based on memory.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "<string>",
      "text": "<question>",
      "category": "<category>",
      "difficulty": "<Easy | Medium | Hard>",
      "memory_reference": "<why this question — what past weakness does it address>",
      "expected_keywords": ["<keyword>"]
    }
  ],
  "memory_feedback": "<personalized message referencing specific past struggles>",
  "focus_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "session_strategy": "<how today's session is tailored based on memory>",
  "encouragement": "<1 sentence acknowledging improvement or effort since last session>"
}`;

  const result = await model().generateContent(prompt);
  return parseJSON(result.response.text(), 'MemoryRAG');
};
