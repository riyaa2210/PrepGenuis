const { generateWithFallback, parseJSON } = require('../config/gemini');
const AppError = require('../utils/AppError');

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

  const prompt = `You are a strict ATS (Applicant Tracking System).
Compare the resume against the job description. Do NOT inflate scores.

${resumeBlock}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON:
{
  "match_score": <0-100>,
  "matched_skills": ["<skill>"],
  "missing_skills": ["<skill>"],
  "keyword_density": {
    "high_impact_present": ["<keyword>"],
    "high_impact_missing": ["<keyword>"]
  },
  "section_scores": {
    "skills_match": <0-100>,
    "experience_relevance": <0-100>,
    "education_fit": <0-100>
  },
  "improvement_suggestions": ["<actionable suggestion>"],
  "ats_verdict": "<STRONG MATCH | MODERATE MATCH | WEAK MATCH | NOT SUITABLE>",
  "summary": "<2 sentence honest assessment>"
}`;

  const raw = await generateWithFallback(prompt);
  const parsed = parseJSON(raw, 'ATS');
  parsed.match_score = Math.max(0, Math.min(100, parseInt(parsed.match_score) || 0));
  return { ...parsed, analyzedAt: new Date().toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SPEECH ANALYZER
// ─────────────────────────────────────────────────────────────────────────────
const FILLER_WORDS = ['um','uh','like','you know','basically','literally','actually','right','so','kind of','sort of','i mean','well','okay','yeah','just','honestly','obviously','clearly','totally','absolutely'];

const detectFillers = (transcript) => {
  const lower = transcript.toLowerCase();
  const found = {};
  FILLER_WORDS.forEach((fw) => {
    const matches = lower.match(new RegExp(`\\b${fw}\\b`, 'gi'));
    if (matches) found[fw] = matches.length;
  });
  return found;
};

const estimateWPM = (transcript, durationSeconds) => {
  if (!durationSeconds || durationSeconds <= 0) return null;
  return Math.round((transcript.trim().split(/\s+/).length / durationSeconds) * 60);
};

exports.analyzeSpeech = async ({ transcript, durationSeconds, questionContext }) => {
  if (!transcript?.trim()) throw new AppError('Transcript is required.', 400);

  const fillerMap   = detectFillers(transcript);
  const fillerList  = Object.entries(fillerMap).sort((a, b) => b[1] - a[1]).map(([w, c]) => `"${w}" (×${c})`);
  const totalFillers = Object.values(fillerMap).reduce((s, c) => s + c, 0);
  const wordCount   = transcript.trim().split(/\s+/).length;
  const fillerRatio = wordCount > 0 ? ((totalFillers / wordCount) * 100).toFixed(1) : 0;
  const wpm         = estimateWPM(transcript, durationSeconds);

  const prompt = `You are a professional communication coach.
Evaluate this interview answer transcript.

CONTEXT: ${questionContext || 'General interview answer'}
WORD COUNT: ${wordCount} | WPM: ${wpm ?? 'Unknown'} | FILLER RATIO: ${fillerRatio}%
FILLERS DETECTED: ${fillerList.join(', ') || 'None'}

TRANSCRIPT: "${transcript}"

Return ONLY valid JSON:
{
  "clarity_score": <0-10>,
  "confidence_score": <0-10>,
  "filler_words_detected": ["<word (×count)>"],
  "filler_ratio_percent": ${fillerRatio},
  "word_count": ${wordCount},
  "estimated_wpm": ${wpm ?? null},
  "pace_assessment": "<Too Slow | Good | Too Fast | Unknown>",
  "speaking_feedback": ["<specific observation>"],
  "improvement_tips": ["<actionable tip>"],
  "strongest_moment": "<best part>",
  "weakest_moment": "<weakest part>",
  "overall_verdict": "<Excellent | Good | Needs Improvement | Poor>"
}`;

  const raw    = await generateWithFallback(prompt);
  const parsed = parseJSON(raw, 'Speech');

  parsed.filler_words_detected = fillerList.length > 0 ? fillerList : [];
  parsed.filler_ratio_percent  = parseFloat(fillerRatio);
  parsed.word_count            = wordCount;
  parsed.estimated_wpm         = wpm;
  parsed.clarity_score    = Math.max(0, Math.min(10, parseFloat(parsed.clarity_score)    || 0));
  parsed.confidence_score = Math.max(0, Math.min(10, parseFloat(parsed.confidence_score) || 0));

  return { ...parsed, analyzedAt: new Date().toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEHAVIORAL ANALYZER
// ─────────────────────────────────────────────────────────────────────────────
exports.analyzeBehavior = async ({ eyeContactPercent, facialEmotions, headMovementData, durationSeconds, candidateName }) => {
  const clamp = (v) => Math.max(0, Math.min(100, parseFloat(v) || 0));
  const eye = clamp(eyeContactPercent);
  const fe  = { confident: clamp(facialEmotions?.confident), nervous: clamp(facialEmotions?.nervous), neutral: clamp(facialEmotions?.neutral), happy: clamp(facialEmotions?.happy) };
  const hm  = { stable: clamp(headMovementData?.stable), nodding: clamp(headMovementData?.nodding), excessive: clamp(headMovementData?.excessive) };
  const eyeScore = Math.round((eye / 100) * 10 * 10) / 10;

  const prompt = `You are an expert behavioral analyst for recruiting.

CANDIDATE: ${candidateName || 'Candidate'}
DURATION: ${durationSeconds ? `${Math.round(durationSeconds / 60)} min` : 'Unknown'}
Eye Contact: ${eye}% | Confident: ${fe.confident}% | Nervous: ${fe.nervous}% | Neutral: ${fe.neutral}% | Happy: ${fe.happy}%
Head Stable: ${hm.stable}% | Nodding: ${hm.nodding}% | Excessive: ${hm.excessive}%

Return ONLY valid JSON:
{
  "eye_contact_score": ${eyeScore},
  "eye_contact_percent": ${eye},
  "confidence_level": "<Very High | High | Moderate | Low | Very Low>",
  "nervousness_level": "<Minimal | Slight | Moderate | High | Severe>",
  "dominant_emotion": "<highest % emotion>",
  "body_language_feedback": ["<observation>"],
  "positive_signals": ["<positive signal>"],
  "areas_to_improve": ["<improvement>"],
  "final_assessment": "<recruiter debrief note>",
  "hire_signal": "<Strong Positive | Positive | Neutral | Concerning | Strong Concern>"
}`;

  const raw    = await generateWithFallback(prompt);
  const parsed = parseJSON(raw, 'Behavior');
  parsed.eye_contact_score   = eyeScore;
  parsed.eye_contact_percent = eye;
  return { ...parsed, analyzedAt: new Date().toISOString() };
};
