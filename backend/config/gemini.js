const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Model priority list — tries each in order on quota/rate errors.
 * gemini-1.5-flash-8b  → free tier, 1500 req/day, 1M tokens/min
 * gemini-1.5-flash     → free tier, 1500 req/day fallback
 * gemini-2.0-flash-lite → free tier alternative
 */
const MODEL_FALLBACKS = [
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

const isQuotaError = (err) => {
  const msg = err?.message || '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate content with automatic model fallback + exponential backoff.
 * @param {string} prompt
 * @param {number} maxRetries  per model
 */
const generateWithFallback = async (prompt, maxRetries = 2) => {
  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        if (isQuotaError(err)) {
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
            logger.warn(`Gemini quota hit on ${modelName}, retry ${attempt + 1} in ${delay}ms`);
            await sleep(delay);
          } else {
            logger.warn(`Gemini quota exhausted on ${modelName}, trying next model`);
            break; // try next model
          }
        } else {
          throw err; // non-quota error — propagate immediately
        }
      }
    }
  }
  throw new Error('All Gemini models exhausted quota. Please wait or upgrade your API plan.');
};

module.exports = { generateWithFallback };
