const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Verified free-tier models (April 2026) ───────────────────────────────────
const MODEL_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

// ─── Low-temperature config for deterministic, accurate outputs ───────────────
const GENERATION_CONFIG = {
  temperature:     0.2,   // low = consistent, less hallucination
  topP:            0.8,
  topK:            20,
  maxOutputTokens: 4096,
};

// ─── Error classifiers ────────────────────────────────────────────────────────
const isQuotaError = (err) => {
  const m = err?.message || '';
  return m.includes('429') || m.includes('quota') ||
         m.includes('RESOURCE_EXHAUSTED') || m.includes('Too Many Requests');
};

const isNotFoundError = (err) => {
  const m = err?.message || '';
  return m.includes('404') || m.includes('not found') || m.includes('not supported');
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Core generator with model fallback + backoff ─────────────────────────────
const generateWithFallback = async (prompt) => {
  const errors = [];

  for (const modelName of MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: GENERATION_CONFIG,
        });
        const result = await model.generateContent(prompt);
        if (attempt > 0 || errors.length > 0) {
          logger.info(`Gemini OK: ${modelName} (attempt ${attempt + 1})`);
        }
        return result.response.text();
      } catch (err) {
        if (isNotFoundError(err)) {
          logger.warn(`Gemini model ${modelName} not found, skipping`);
          errors.push(`${modelName}: not found`);
          break;
        } else if (isQuotaError(err)) {
          if (attempt === 0) {
            const delay = 1500 * (errors.length + 1);
            logger.warn(`Gemini quota on ${modelName}, retry in ${delay}ms`);
            await sleep(delay);
          } else {
            logger.warn(`Gemini quota exhausted on ${modelName}`);
            errors.push(`${modelName}: quota exhausted`);
            break;
          }
        } else {
          throw err;
        }
      }
    }
  }

  const summary = errors.join(' | ');
  logger.error(`All Gemini models failed: ${summary}`);
  throw new Error(`AI service unavailable. ${summary}`);
};

// ─── Strict JSON parser ───────────────────────────────────────────────────────
// Strips markdown fences, extracts first valid JSON object or array
const parseJSON = (raw, label, type = 'object') => {
  const cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(pattern);

  if (!match) {
    throw new Error(`No valid JSON ${type} for "${label}". Got: ${raw.slice(0, 120)}`);
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error(`JSON.parse failed for "${label}": ${e.message}`);
  }
};

const parseJSONArray = (raw, label) => parseJSON(raw, label, 'array');

// ─── Input sanitiser ─────────────────────────────────────────────────────────
// Cleans text before sending to AI — removes junk, caps length
const sanitise = (text, maxChars = 6000) => {
  if (!text) return '';
  return text
    .replace(/\0/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxChars);
};

// ─── Retry wrapper ────────────────────────────────────────────────────────────
// Retries up to maxRetries if JSON parsing or schema validation fails
const generateWithRetry = async (prompt, validator, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const raw    = await generateWithFallback(prompt);
      const parsed = parseJSON(raw, 'response');
      if (validator) validator(parsed);
      return { raw, parsed };
    } catch (err) {
      lastError = err;
      logger.warn(`Gemini retry ${i + 1}/${maxRetries}: ${err.message}`);
      if (i < maxRetries - 1) await sleep(800 * (i + 1));
    }
  }
  throw new Error(`AI failed after ${maxRetries} retries: ${lastError?.message}`);
};

// ─── Schema validators ────────────────────────────────────────────────────────
const validators = {
  questions: (data, expectedCount) => {
    if (!Array.isArray(data.questions)) throw new Error('questions must be array');
    if (data.questions.length < 1)     throw new Error('questions array empty');
    if (expectedCount && data.questions.length < expectedCount - 2) {
      throw new Error(`Expected ~${expectedCount} questions, got ${data.questions.length}`);
    }
    data.questions.forEach((q, i) => {
      if (!q.text) throw new Error(`Question ${i + 1} missing text`);
      if (!Array.isArray(q.expectedKeywords)) q.expectedKeywords = [];
    });
  },

  evaluation: (data) => {
    const score = Number(data.score);
    if (isNaN(score) || score < 0 || score > 10) throw new Error(`Invalid score: ${data.score}`);
    if (!data.feedback) throw new Error('Missing feedback');
    data.score = Math.round(score * 10) / 10;
    if (!Array.isArray(data.fillerWords)) data.fillerWords = [];
    if (typeof data.fillerWordCount !== 'number') data.fillerWordCount = data.fillerWords.length;
  },

  scorecard: (data) => {
    const fields = ['communicationScore', 'technicalScore', 'confidenceScore', 'clarityScore', 'overallScore'];
    fields.forEach((f) => {
      const v = Number(data[f]);
      if (isNaN(v) || v < 0 || v > 10) throw new Error(`Invalid ${f}: ${data[f]}`);
      data[f] = Math.round(v * 10) / 10;
    });
    if (!Array.isArray(data.strengths))    data.strengths    = [];
    if (!Array.isArray(data.improvements)) data.improvements = [];
    if (!data.aiSummary) data.aiSummary = '';
  },

  resume: (data) => {
    if (!Array.isArray(data.skills))     data.skills     = [];
    if (!Array.isArray(data.experience)) data.experience = [];
    if (!Array.isArray(data.education))  data.education  = [];
    if (!Array.isArray(data.projects))   data.projects   = [];
  },
};

module.exports = {
  generateWithFallback,
  generateWithRetry,
  parseJSON,
  parseJSONArray,
  sanitise,
  validators,
  GENERATION_CONFIG,
};
