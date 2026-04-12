const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');
const { generateWithFallback } = require('../config/gemini');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Legacy helper kept for any direct model calls
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

/**
 * Generate personalized interview questions using RAG (resume + JD)
 */
exports.generateInterviewQuestions = async ({ resume, jobDescription, round, difficulty, count = 8 }) => {
  const prompt = `
You are an expert technical interviewer. Generate ${count} interview questions for a ${round} round interview.

CANDIDATE RESUME SUMMARY:
${resume}

JOB DESCRIPTION:
${jobDescription}

DIFFICULTY LEVEL: ${difficulty}
ROUND TYPE: ${round}

Instructions:
- Questions must be personalized based on the candidate's resume and the job description
- For technical round: focus on skills mentioned in resume and JD
- For HR round: focus on behavioral and situational questions
- For managerial round: focus on leadership, conflict resolution, and strategy
- Vary question types: conceptual, scenario-based, problem-solving
- Each question should have a category and expected keywords

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "text": "question text here",
      "category": "category name",
      "difficulty": "${difficulty}",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI response for questions');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Evaluate a single answer and return AI feedback
 */
exports.evaluateAnswer = async ({ question, answer, expectedKeywords, round }) => {
  const prompt = `
You are an expert interviewer evaluating a candidate's answer.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}
EXPECTED KEYWORDS: ${expectedKeywords?.join(', ') || 'N/A'}
ROUND: ${round}

Evaluate the answer on:
1. Relevance and accuracy
2. Depth of knowledge
3. Communication clarity
4. Use of expected keywords

Also detect filler words (um, uh, like, you know, basically, literally, actually, right, so).

Respond ONLY with valid JSON:
{
  "score": <number 0-10>,
  "feedback": "<specific feedback on what was good and what was missing>",
  "betterAnswer": "<a model answer for this question>",
  "fillerWords": ["list", "of", "filler", "words", "found"],
  "fillerWordCount": <number>
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI evaluation');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Generate full scorecard after interview completion
 */
exports.generateScorecard = async ({ answers, round, jobDescription }) => {
  const answersText = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}\nScore: ${a.aiEvaluation?.score || 0}/10`)
    .join('\n\n');

  const prompt = `
You are an expert interview coach. Analyze the complete interview performance.

ROUND: ${round}
JOB DESCRIPTION: ${jobDescription || 'Not provided'}

INTERVIEW Q&A:
${answersText}

Generate a comprehensive scorecard. Respond ONLY with valid JSON:
{
  "communicationScore": <0-10>,
  "technicalScore": <0-10>,
  "confidenceScore": <0-10>,
  "clarityScore": <0-10>,
  "overallScore": <0-10>,
  "fillerWordsDetected": ["list of all filler words used"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "aiSummary": "<2-3 sentence professional summary of the candidate's performance>"
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse scorecard');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Parse resume text and extract structured data
 */
exports.parseResume = async (rawText) => {
  const prompt = `
You are an expert resume parser. Extract structured information from this resume text.

RESUME TEXT:
${rawText}

Respond ONLY with valid JSON:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "company": "", "role": "", "duration": "", "description": "" }
  ],
  "education": [
    { "institution": "", "degree": "", "year": "" }
  ],
  "projects": [
    { "name": "", "description": "", "technologies": [], "link": "" }
  ],
  "certifications": []
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse resume');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Generate ATS score and feedback for a resume
 */
exports.generateATSScore = async ({ resumeText, jobDescription }) => {
  const prompt = `
You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription || 'General software engineering role'}

Respond ONLY with valid JSON:
{
  "atsScore": <0-100>,
  "feedback": "<detailed feedback on how to improve ATS compatibility>"
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to generate ATS score');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Real-time speech feedback (analyze a short transcript snippet)
 */
exports.getRealTimeFeedback = async (transcript) => {
  const prompt = `
You are a real-time speech coach. Analyze this short speech snippet and give instant feedback.

TRANSCRIPT: "${transcript}"

Give very brief, actionable feedback (max 15 words). Focus on:
- Filler words (um, uh, like, you know)
- Speaking pace
- Clarity

Respond ONLY with valid JSON:
{
  "feedback": "<short actionable tip>",
  "type": "<one of: filler_words | pace | clarity | good>",
  "fillerWordsFound": ["list"]
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { feedback: 'Keep going!', type: 'good', fillerWordsFound: [] };
  return JSON.parse(jsonMatch[0]);
};

/**
 * Evaluate coding solution
 */
exports.evaluateCodingSolution = async ({ problem, solution, language }) => {
  const prompt = `
You are an expert software engineer reviewing a coding interview solution.

PROBLEM: ${problem}
LANGUAGE: ${language}
SOLUTION:
\`\`\`${language}
${solution}
\`\`\`

Evaluate the solution. Respond ONLY with valid JSON:
{
  "score": <0-10>,
  "feedback": "<detailed code review>",
  "timeComplexity": "<e.g. O(n log n)>",
  "spaceComplexity": "<e.g. O(n)>",
  "isCorrect": <true|false>,
  "improvements": "<suggestions for improvement>"
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to evaluate code');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Generate learning roadmap based on weak topics
 */
exports.generateLearningRoadmap = async ({ weakTopics, role }) => {
  const prompt = `
You are a senior engineering mentor. Create a personalized learning roadmap.

TARGET ROLE: ${role || 'Software Engineer'}
WEAK TOPICS: ${weakTopics.join(', ')}

Respond ONLY with valid JSON:
{
  "roadmap": [
    {
      "topic": "<topic name>",
      "priority": "<high|medium|low>",
      "resources": ["resource 1", "resource 2"],
      "estimatedTime": "<e.g. 2 weeks>",
      "milestones": ["milestone 1", "milestone 2"]
    }
  ],
  "summary": "<overall learning plan summary>"
}`;

  const text = await generateWithFallback(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to generate roadmap');
  return JSON.parse(jsonMatch[0]);
};


