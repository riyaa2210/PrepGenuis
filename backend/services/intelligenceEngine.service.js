const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../utils/AppError');

const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model  = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const parseJSON = (raw, label) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError(`AI returned invalid JSON for ${label}.`, 500);
  try { return JSON.parse(match[0]); }
  catch { throw new AppError(`Failed to parse ${label} response.`, 500); }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. ATS ANALYZER
// ─────────────────────────────────────────────────────────────────────────────
exports.analyzeATS = async ({ resumeText, skills, jobDescription }) => {
  if (!jobDescription?.trim()) throw new AppError('Job description is required.', 400);
  if (!resumeText && (!skills || skills.length === 0))
    throw new AppError('Resume text or skills are required.', 400);

  const resumeBlock = resumeText
    ? `FULL RESUME TEXT:\n${resumeText}`
    : `CANDIDATE SKILLS: ${skills.join(', ')}`;

  const prompt = `
You are a strict, enterprise-grade ATS (Applicant Tracking System) used by Fortune 500 companies.
Your job is to compare a candidate's resume against a job description and return an honest match analysis.

RULES:
- Do NOT inflate scores. A score of 70+ means genuinely strong alignment.
- matched_skills: only skills explicitly present in BOTH resume and JD.
- missing_skills: important skills from JD that are absent from the resume.
- improvement_suggestions: concrete, actionable resume edits (not generic advice).
- Penalise missing critical/required skills heavily.
- Consider keyword density, seniority signals, and technology stack alignment.

${resumeBlock}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON (no markdown):
{
  "match_score": <integer 0-100>,
  "matched_skills": ["<skill>"],
  "missing_skills": ["<skill>"],
  "keyword_density": {
    "high_impact_present": ["<keyword found in both>"],
    "high_impact_missing": ["<critical JD keyword not in resume>"]
  },
  "section_scores": {
    "skills_match": <0-100>,
    "experience_relevance": <0-100>,
    "education_fit": <0-100>
  },
  "improvement_suggestions": [
    "<specific, actionable suggestion>"
  ],
  "ats_verdict": "<STRONG MATCH | MODERATE MATCH | WEAK MATCH | NOT SUITABLE>",
  "summary": "<2 sentence honest assessment>"
}`;

  const result = await model().generateContent(prompt);
  const parsed = parseJSON(result.response.text(), 'ATS');

  // Clamp score
  parsed.match_score = Math.max(0, Math.min(100, parseInt(parsed.match_score) || 0));
  return { ...parsed, analyzedAt: new Date().toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SPEECH / COMMUNICATION ANALYZER
// ─────────────────────────────────────────────────────────────────────────────
const FILLER_WORDS = [
  'um','uh','like','you know','basically','literally','actually',
  'right','so','kind of','sort of','i mean','well','okay','yeah',
  'just','honestly','obviously','clearly','totally','absolutely',
];

const detectFillers = (transcript) => {
  const lower = transcript.toLowerCase();
  const found = {};
  FILLER_WORDS.forEach((fw) => {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) found[fw] = matches.length;
  });
  return found; // { "um": 4, "like": 7 }
};

const estimateWPM = (transcript, durationSeconds) => {
  if (!durationSeconds || durationSeconds <= 0) return null;
  const words = transcript.trim().split(/\s+/).length;
  return Math.round((words / durationSeconds) * 60);
};

exports.analyzeSpeech = async ({ transcript, durationSeconds, questionContext }) => {
  if (!transcript?.trim()) throw new AppError('Transcript is required.', 400);

  const fillerMap  = detectFillers(transcript);
  const fillerList = Object.entries(fillerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => `"${word}" (×${count})`);
  const totalFillers = Object.values(fillerMap).reduce((s, c) => s + c, 0);
  const wordCount    = transcript.trim().split(/\s+/).length;
  const fillerRatio  = wordCount > 0 ? ((totalFillers / wordCount) * 100).toFixed(1) : 0;
  const wpm          = estimateWPM(transcript, durationSeconds);

  const prompt = `
You are a professional communication coach and speech analyst.
Evaluate the following interview answer transcript with strict, specific feedback.

CONTEXT: ${questionContext || 'General interview answer'}
WORD COUNT: ${wordCount}
DURATION: ${durationSeconds ? `${durationSeconds}s` : 'Unknown'}
ESTIMATED WPM: ${wpm ?? 'Unknown'} ${wpm ? (wpm < 110 ? '(too slow)' : wpm > 160 ? '(too fast)' : '(good pace)') : ''}
FILLER WORDS DETECTED: ${fillerList.length > 0 ? fillerList.join(', ') : 'None'}
FILLER RATIO: ${fillerRatio}% of total words

TRANSCRIPT:
"${transcript}"

SCORING GUIDE:
- clarity_score: Is the answer structured, coherent, and easy to follow? (0-10)
- confidence_score: Does the language convey authority and certainty? (0-10)
  Penalise heavily for excessive hedging ("I think maybe", "I'm not sure but"), filler overuse, and incomplete sentences.

Return ONLY valid JSON (no markdown):
{
  "clarity_score": <0-10>,
  "confidence_score": <0-10>,
  "filler_words_detected": ["<word (×count)>"],
  "filler_ratio_percent": ${fillerRatio},
  "word_count": ${wordCount},
  "estimated_wpm": ${wpm ?? null},
  "pace_assessment": "<Too Slow | Good | Too Fast | Unknown>",
  "speaking_feedback": [
    "<specific observation about this transcript>"
  ],
  "improvement_tips": [
    "<concrete, actionable tip>"
  ],
  "strongest_moment": "<quote or describe the best part of the answer>",
  "weakest_moment": "<quote or describe the weakest part>",
  "overall_verdict": "<Excellent | Good | Needs Improvement | Poor>"
}`;

  const result = await model().generateContent(prompt);
  const parsed = parseJSON(result.response.text(), 'Speech');

  // Override with deterministic filler data
  parsed.filler_words_detected = fillerList.length > 0 ? fillerList : [];
  parsed.filler_ratio_percent  = parseFloat(fillerRatio);
  parsed.word_count            = wordCount;
  parsed.estimated_wpm         = wpm;
  parsed.clarity_score    = Math.max(0, Math.min(10, parseFloat(parsed.clarity_score)    || 0));
  parsed.confidence_score = Math.max(0, Math.min(10, parseFloat(parsed.confidence_score) || 0));

  return { ...parsed, analyzedAt: new Date().toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEHAVIORAL / BODY LANGUAGE ANALYZER
// ─────────────────────────────────────────────────────────────────────────────
exports.analyzeBehavior = async ({
  eyeContactPercent,
  facialEmotions,      // { confident: 0-100, nervous: 0-100, neutral: 0-100, happy: 0-100 }
  headMovementData,    // { stable: 0-100, nodding: 0-100, excessive: 0-100 }
  durationSeconds,
  candidateName,
}) => {
  // Validate ranges
  const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, parseFloat(v) || 0));
  const eye   = clamp(eyeContactPercent);
  const fe    = {
    confident: clamp(facialEmotions?.confident),
    nervous:   clamp(facialEmotions?.nervous),
    neutral:   clamp(facialEmotions?.neutral),
    happy:     clamp(facialEmotions?.happy),
  };
  const hm = {
    stable:    clamp(headMovementData?.stable),
    nodding:   clamp(headMovementData?.nodding),
    excessive: clamp(headMovementData?.excessive),
  };

  // Deterministic eye contact score (0-10)
  const eyeScore = Math.round((eye / 100) * 10 * 10) / 10;

  const prompt = `
You are an expert behavioral analyst and body language coach used by top recruiting firms.
Analyse the following non-verbal interview data and return a professional, recruiter-friendly assessment.

CANDIDATE: ${candidateName || 'Candidate'}
INTERVIEW DURATION: ${durationSeconds ? `${Math.round(durationSeconds / 60)} minutes` : 'Unknown'}

NON-VERBAL DATA:
  Eye Contact       : ${eye}% of interview duration
  Facial Emotions   :
    - Confident     : ${fe.confident}%
    - Nervous       : ${fe.nervous}%
    - Neutral       : ${fe.neutral}%
    - Happy/Engaged : ${fe.happy}%
  Head Movement     :
    - Stable        : ${hm.stable}%
    - Nodding       : ${hm.nodding}%
    - Excessive     : ${hm.excessive}%

SCORING GUIDE:
- eye_contact_score (0-10): 70-80% eye contact = ideal (8-9). <40% = poor (≤4). >90% = slightly intense (7).
- confidence_level: derive from facial + head data. Options: "Very High | High | Moderate | Low | Very Low"
- nervousness_level: Options: "Minimal | Slight | Moderate | High | Severe"
- body_language_feedback: 3-5 specific, professional observations based on the numbers above.
- final_assessment: 2-3 sentences a recruiter would write in a debrief note.

Return ONLY valid JSON (no markdown):
{
  "eye_contact_score": ${eyeScore},
  "eye_contact_percent": ${eye},
  "confidence_level": "<level>",
  "nervousness_level": "<level>",
  "dominant_emotion": "<the highest % facial emotion>",
  "body_language_feedback": [
    "<specific professional observation>"
  ],
  "positive_signals": [
    "<positive non-verbal signal observed>"
  ],
  "areas_to_improve": [
    "<specific improvement>"
  ],
  "final_assessment": "<recruiter-style debrief note>",
  "hire_signal": "<Strong Positive | Positive | Neutral | Concerning | Strong Concern>"
}`;

  const result = await model().generateContent(prompt);
  const parsed = parseJSON(result.response.text(), 'Behavior');

  // Override with deterministic values
  parsed.eye_contact_score   = eyeScore;
  parsed.eye_contact_percent = eye;

  return { ...parsed, analyzedAt: new Date().toISOString() };
};
