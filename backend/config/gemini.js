const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Free-tier models confirmed working on v1beta as of April 2026.
 * Order = preference. Falls through on 429 quota errors.
 *
 * gemini-flash-latest  â€” 1500 req/day, fastest, cheapest
 * gemini-flash-lite-latest     â€” 1500 req/day, better quality
 * gemini-2.5-flash-lite â€” free tier alternative
 */
const MODEL_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

const isQuotaError = (err) => {
  const msg = err?.message || '';
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Too Many Requests')
  );
};

const isNotFoundError = (err) => {
  const msg = err?.message || '';
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate content with automatic model fallback + exponential backoff.
 * All services must use this instead of calling model().generateContent() directly.
 *
 * @param {string} prompt
 * @param {number} retryDelay  base delay ms between retries on same model
 * @returns {string} raw text response
 */
const generateWithFallback = async (prompt, retryDelay = 1000) => {
  const errors = [];

  for (const modelName of MODEL_FALLBACKS) {
    // Try each model up to 2 times on quota errors
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        if (attempt > 0 || errors.length > 0) {
          logger.info(`Gemini succeeded with model: ${modelName}`);
        }
        return result.response.text();
      } catch (err) {
        if (isNotFoundError(err)) {
          // Model doesn't exist â€” skip immediately, no retry
          logger.warn(`Gemini model ${modelName} not found, skipping`);
          errors.push(`${modelName}: not found`);
          break;
        } else if (isQuotaError(err)) {
          if (attempt === 0) {
            // First attempt failed on quota â€” wait and retry once
            const delay = retryDelay * (errors.length + 1);
            logger.warn(`Gemini quota hit on ${modelName}, retrying in ${delay}ms`);
            await sleep(delay);
          } else {
            // Second attempt also failed â€” move to next model
            logger.warn(`Gemini quota exhausted on ${modelName}, trying next model`);
            errors.push(`${modelName}: quota exhausted`);
            break;
          }
        } else {
          // Unknown error â€” propagate immediately (don't retry)
          throw err;
        }
      }
    }
  }

  // All models failed
  const summary = errors.join(' | ');
  logger.error(`All Gemini models failed: ${summary}`);
  throw new Error(
    `AI service temporarily unavailable. All models exhausted quota. ` +
    `Please wait a few minutes and try again. (${summary})`
  );
};

/**
 * Parse JSON from Gemini response â€” strips markdown fences if present.
 */
const parseJSON = (raw, label) => {
  // Try object first, then array
  const objMatch = raw.match(/\{[\s\S]*\}/);
  const arrMatch = raw.match(/\[[\s\S]*\]/);
  const match = objMatch || arrMatch;
  if (!match) throw new Error(`AI returned invalid JSON for ${label}`);
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error(`Failed to parse ${label} JSON response`);
  }
};

/**
 * Parse JSON array specifically.
 */
const parseJSONArray = (raw, label) => {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`AI returned invalid JSON array for ${label}`);
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error(`Failed to parse ${label} JSON array`);
  }
};

module.exports = { generateWithFallback, parseJSON, parseJSONArray };

