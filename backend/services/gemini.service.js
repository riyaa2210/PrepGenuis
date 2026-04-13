/**
 * gemini.service.js
 *
 * All AI calls go through generateWithRetry (retry + validation).
 * Every prompt uses:
 *   - Explicit role assignment
 *   - Strict JSON-only output instruction
 *   - Few-shot examples where relevant
 *   - "Do not assume missing data" anti-hallucination guard
 *   - Input sanitisation before sending
 */

const { generateWithRetry, sanitise, validators } = require('../config/gemini');

// ─── Shared system preamble ───────────────────────────────────────────────────
const JSON_ONLY = `CRITICAL RULES:
- Return ONLY a valid JSON object. No markdown, no prose, no code fences.
- Do NOT assume or invent data that is not explicitly provided.
- If a field has no data, use null or an empty array — never fabricate.`;

// ─── 1. Generate interview questions ─────────────────────────────────────────
exports.generateInterviewQuestions = async ({
  resume,
  jobDescription,
  round,
  difficulty,
  count = 8,
}) => {
  const cleanResume = sanitise(resume, 3000);
  const cleanJD     = sanitise(jobDescription, 2000);

  const roundGuide = {
    hr:         'Behavioral questions using STAR method (Situation, Task, Action, Result). Focus on teamwork, conflict, motivation.',
    technical:  'DSA, system design, coding concepts, time/space complexity. At least 1 system design question.',
    managerial: 'Leadership, decision-making under pressure, stakeholder management, conflict resolution.',
    coding:     'Algorithmic problems with clear constraints. Include expected input/output.',
    mock:       'Mix of behavioral and technical questions appropriate for the role.',
  };

  const difficultyGuide = {
    easy:   'Foundational concepts, definitions, simple scenarios.',
    medium: 'Applied knowledge, trade-offs, moderate complexity.',
    hard:   'Deep expertise, edge cases, architectural decisions.',
  };

  const prompt = `You are a senior technical interviewer at a top-tier tech company.

TASK: Generate exactly ${count} interview questions for a ${round.toUpperCase()} round.

ROUND FOCUS: ${roundGuide[round] || roundGuide.mock}
DIFFICULTY: ${difficulty} — ${difficultyGuide[difficulty] || difficultyGuide.medium}

CANDIDATE RESUME:
${cleanResume || 'Not provided'}

JOB DESCRIPTION:
${cleanJD || 'General software engineering role'}

REQUIREMENTS:
- Personalize questions to the candidate's actual skills and experience listed above
- Do NOT repeat question types — vary between conceptual, scenario, problem-solving
- Each question must have 3–5 expected keywords the answer should contain
- Assign a category (e.g. "System Design", "Behavioral", "DSA", "Leadership")

FEW-SHOT EXAMPLE (technical, medium):
{
  "text": "You have a distributed cache that occasionally returns stale data. How would you design a cache invalidation strategy?",
  "category": "System Design",
  "difficulty": "medium",
  "expectedKeywords": ["TTL", "event-driven", "write-through", "consistency", "invalidation"]
}

${JSON_ONLY}

Return this exact structure:
{
  "questions": [
    {
      "text": "<full question>",
      "category": "<category>",
      "difficulty": "${difficulty}",
      "expectedKeywords": ["<kw1>", "<kw2>", "<kw3>"]
    }
  ]
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    (data) => validators.questions(data, count),
    3
  );

  return parsed;
};

// ─── 2. Evaluate a single answer ─────────────────────────────────────────────
exports.evaluateAnswer = async ({ question, answer, expectedKeywords, round }) => {
  const cleanAnswer = sanitise(answer, 2000);

  // Rubric-based scoring breakdown
  const rubric = `SCORING RUBRIC (each dimension 0–10, final score = weighted average):
- Technical Accuracy (40%): Is the answer factually correct? Does it use right terminology?
- Depth & Completeness (30%): Does it cover edge cases, trade-offs, or nuances?
- Clarity & Structure (20%): Is it well-organized and easy to follow?
- Use of Examples (10%): Does it include concrete examples or analogies?`;

  const fillerList = 'um, uh, like, you know, basically, literally, actually, right, so, kind of, sort of, I mean, well, okay, yeah, just, honestly, obviously';

  const prompt = `You are an expert ${round} interviewer evaluating a candidate's answer.

QUESTION: ${question}
EXPECTED KEYWORDS: ${expectedKeywords?.join(', ') || 'none specified'}
ROUND TYPE: ${round}

CANDIDATE'S ANSWER:
"${cleanAnswer || '(no answer provided)'}"

${rubric}

FILLER WORDS TO DETECT: ${fillerList}

INSTRUCTIONS:
- Score strictly based on the rubric above
- If the answer is empty or off-topic, score must be 0–2
- feedback must reference specific parts of the answer — no generic statements
- betterAnswer must be a model answer a senior engineer would give
- Do NOT assume the candidate knows things not shown in their answer

FEW-SHOT EXAMPLE OUTPUT:
{
  "score": 6.5,
  "rubricBreakdown": { "technicalAccuracy": 7, "depthCompleteness": 6, "clarityStructure": 7, "useOfExamples": 5 },
  "feedback": "Good explanation of LRU eviction but missed discussing cache stampede and TTL strategies.",
  "betterAnswer": "An LRU cache evicts the least recently used item. For distributed systems, you'd also handle cache stampede using mutex locks or probabilistic early expiration...",
  "fillerWords": ["basically", "like"],
  "fillerWordCount": 2
}

${JSON_ONLY}

Return:
{
  "score": <number 0–10, one decimal>,
  "rubricBreakdown": {
    "technicalAccuracy": <0–10>,
    "depthCompleteness": <0–10>,
    "clarityStructure": <0–10>,
    "useOfExamples": <0–10>
  },
  "feedback": "<specific, evidence-based feedback referencing the answer>",
  "betterAnswer": "<model answer a senior engineer would give>",
  "fillerWords": ["<detected filler words only>"],
  "fillerWordCount": <integer>
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    validators.evaluation,
    3
  );

  return parsed;
};

// ─── 3. Generate full scorecard ───────────────────────────────────────────────
exports.generateScorecard = async ({ answers, round, jobDescription }) => {
  const cleanJD = sanitise(jobDescription, 1000);

  const answersText = answers
    .map((a, i) =>
      `Q${i + 1}: ${a.question}\n` +
      `Answer: ${sanitise(a.answer, 400) || '(no answer)'}\n` +
      `Score: ${a.aiEvaluation?.score ?? 'N/A'}/10`
    )
    .join('\n\n');

  const prompt = `You are a senior interview coach generating a post-interview performance report.

ROUND: ${round.toUpperCase()}
JOB DESCRIPTION: ${cleanJD || 'Not provided'}

INTERVIEW TRANSCRIPT:
${answersText}

SCORING DIMENSIONS:
- technicalScore: Accuracy and depth of technical answers
- communicationScore: Clarity, structure, and articulation across all answers
- confidenceScore: Assertiveness, directness, absence of excessive hedging
- clarityScore: Logical flow, conciseness, absence of filler words
- overallScore: Holistic weighted average (technical 40%, communication 25%, confidence 20%, clarity 15%)

INSTRUCTIONS:
- Base every score on the actual transcript above — do NOT invent performance
- strengths: 2–4 specific observations backed by evidence from the transcript
- improvements: 2–4 specific, actionable suggestions
- aiSummary: 2–3 sentences a hiring manager would read in a debrief

${JSON_ONLY}

Return:
{
  "technicalScore": <0–10>,
  "communicationScore": <0–10>,
  "confidenceScore": <0–10>,
  "clarityScore": <0–10>,
  "overallScore": <0–10>,
  "fillerWordsDetected": ["<word>"],
  "strengths": ["<specific strength with evidence>"],
  "improvements": ["<specific, actionable improvement>"],
  "aiSummary": "<2–3 sentence hiring manager summary>"
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    validators.scorecard,
    3
  );

  return parsed;
};

// ─── 4. Parse resume ──────────────────────────────────────────────────────────
exports.parseResume = async (rawText) => {
  const cleanText = sanitise(rawText, 5000);

  const prompt = `You are a professional resume parser.

TASK: Extract structured data from the resume text below.

RESUME TEXT:
${cleanText}

INSTRUCTIONS:
- Extract only information explicitly present in the text
- Do NOT infer, guess, or fabricate any field
- If a field is not present, use null (strings) or [] (arrays)
- skills: flat list of technical and soft skills mentioned anywhere
- For experience entries, extract only what is written — do not summarize differently

${JSON_ONLY}

Return:
{
  "name": "<full name or null>",
  "email": "<email or null>",
  "phone": "<phone or null>",
  "location": "<city/country or null>",
  "summary": "<professional summary or null>",
  "skills": ["<skill>"],
  "experience": [
    { "company": "<name>", "role": "<title>", "duration": "<dates>", "description": "<responsibilities>" }
  ],
  "education": [
    { "institution": "<name>", "degree": "<degree>", "year": "<year>" }
  ],
  "projects": [
    { "name": "<name>", "description": "<desc>", "technologies": ["<tech>"], "link": "<url or null>" }
  ],
  "certifications": ["<cert>"]
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    validators.resume,
    3
  );

  return parsed;
};

// ─── 5. ATS score ─────────────────────────────────────────────────────────────
exports.generateATSScore = async ({ resumeText, jobDescription }) => {
  const cleanResume = sanitise(resumeText, 3000);
  const cleanJD     = sanitise(jobDescription, 2000);

  const prompt = `You are an enterprise ATS (Applicant Tracking System) engine.

TASK: Score how well this resume matches the job description.

RESUME:
${cleanResume || 'Not provided'}

JOB DESCRIPTION:
${cleanJD || 'General software engineering role'}

SCORING CRITERIA:
- Keyword match: required skills/tools from JD present in resume
- Experience relevance: years and domain match
- Education fit: degree requirements met
- Penalize heavily for missing required skills marked as "must have" or "required"
- Score 70+ only if genuinely strong alignment

INSTRUCTIONS:
- atsScore must be an integer 0–100
- feedback must list specific missing keywords and concrete resume edits
- Do NOT inflate the score

${JSON_ONLY}

Return:
{
  "atsScore": <integer 0–100>,
  "feedback": "<specific feedback with missing keywords and actionable edits>"
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    (data) => {
      const s = Number(data.atsScore);
      if (isNaN(s) || s < 0 || s > 100) throw new Error(`Invalid atsScore: ${data.atsScore}`);
      data.atsScore = Math.round(s);
    },
    3
  );

  return parsed;
};

// ─── 6. Real-time speech feedback ────────────────────────────────────────────
exports.getRealTimeFeedback = async (transcript) => {
  const clean = sanitise(transcript, 500);
  if (!clean) return { feedback: 'Keep going…', type: 'good', fillerWordsFound: [] };

  const prompt = `You are a real-time interview speech coach.

TRANSCRIPT SNIPPET: "${clean}"

TASK: Give ONE short coaching tip (max 8 words) based on what you observe.

TYPE OPTIONS (pick the most relevant):
- "filler"   → excessive filler words detected (um, uh, like, you know)
- "pace"     → speaking too fast or too slow
- "vague"    → answer lacks specifics or examples
- "concise"  → answer is too long or rambling
- "clarity"  → unclear structure or logic
- "good"     → answer is on track, no issues

EXAMPLES:
- "Avoid saying 'like' and 'basically'." → type: filler
- "Add a concrete example here." → type: vague
- "Good structure, keep going." → type: good

${JSON_ONLY}

Return:
{
  "feedback": "<max 8 words>",
  "type": "<filler|pace|vague|concise|clarity|good>",
  "fillerWordsFound": ["<detected fillers>"]
}`;

  try {
    const { parsed } = await generateWithRetry(prompt, null, 2);
    return {
      feedback:        parsed.feedback        || 'Keep going…',
      type:            parsed.type            || 'good',
      fillerWordsFound: parsed.fillerWordsFound || [],
    };
  } catch {
    return { feedback: 'Keep going…', type: 'good', fillerWordsFound: [] };
  }
};

// ─── 7. Evaluate coding solution ─────────────────────────────────────────────
exports.evaluateCodingSolution = async ({ problem, solution, language }) => {
  const cleanSolution = sanitise(solution, 3000);

  const prompt = `You are a senior software engineer conducting a coding interview review.

PROBLEM:
${sanitise(problem, 1000)}

LANGUAGE: ${language}

CANDIDATE'S SOLUTION:
\`\`\`${language}
${cleanSolution}
\`\`\`

EVALUATION CRITERIA:
- Correctness: Does it solve the problem for all cases including edge cases?
- Time Complexity: Analyze using Big-O notation
- Space Complexity: Analyze using Big-O notation
- Code Quality: Naming, readability, structure
- score: 0–10 weighted (correctness 50%, complexity 30%, quality 20%)

INSTRUCTIONS:
- If solution is empty or clearly wrong, score must be 0–3
- improvements must be specific code-level suggestions, not generic advice
- Do NOT assume the solution is correct without verifying the logic

${JSON_ONLY}

Return:
{
  "score": <0–10>,
  "isCorrect": <true|false>,
  "timeComplexity": "<e.g. O(n log n)>",
  "spaceComplexity": "<e.g. O(n)>",
  "feedback": "<specific code review with line-level observations>",
  "improvements": "<concrete refactoring suggestions>"
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    (data) => {
      const s = Number(data.score);
      if (isNaN(s) || s < 0 || s > 10) throw new Error(`Invalid score: ${data.score}`);
      data.score = Math.round(s * 10) / 10;
    },
    3
  );

  return parsed;
};

// ─── 8. Learning roadmap ──────────────────────────────────────────────────────
exports.generateLearningRoadmap = async ({ weakTopics, role }) => {
  if (!weakTopics?.length) throw new Error('weakTopics required');

  const prompt = `You are a senior engineering mentor creating a personalized study plan.

TARGET ROLE: ${sanitise(role, 100) || 'Software Engineer'}
WEAK TOPICS: ${weakTopics.slice(0, 10).join(', ')}

TASK: Create a practical 14-day learning roadmap addressing each weak topic.

REQUIREMENTS:
- Each roadmap item must have specific, actionable tasks (not "study X")
- Resources must be real platforms: LeetCode, NeetCode, System Design Primer, Educative, YouTube channels
- priority: "High" for topics most likely to appear in interviews
- estimatedTime: realistic (e.g. "3 days", "1 week")
- milestones: measurable checkpoints (e.g. "Solve 10 medium DP problems")

${JSON_ONLY}

Return:
{
  "roadmap": [
    {
      "topic": "<topic>",
      "priority": "<High|Medium|Low>",
      "resources": ["<resource name + platform>"],
      "estimatedTime": "<duration>",
      "milestones": ["<measurable checkpoint>"]
    }
  ],
  "summary": "<2-sentence overall plan summary>"
}`;

  const { parsed } = await generateWithRetry(
    prompt,
    (data) => {
      if (!Array.isArray(data.roadmap) || data.roadmap.length < 1) {
        throw new Error('roadmap must be a non-empty array');
      }
    },
    3
  );

  return parsed;
};
