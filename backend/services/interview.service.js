const Interview = require('../models/Interview.model');
const User = require('../models/User.model');
const Resume = require('../models/Resume.model');
const gemini = require('./gemini.service');
const AppError = require('../utils/AppError');

exports.createInterview = async ({ userId, title, jobDescription, round, difficulty }) => {
  // Get user resume for RAG context
  const resume = await Resume.findOne({ user: userId });
  const resumeContext = resume
    ? `Skills: ${resume.skillTags.join(', ')}\nExperience: ${resume.parsed?.experience?.map((e) => `${e.role} at ${e.company}`).join(', ')}\nProjects: ${resume.parsed?.projects?.map((p) => p.name).join(', ')}`
    : 'No resume provided';

  const { questions } = await gemini.generateInterviewQuestions({
    resume: resumeContext,
    jobDescription,
    round,
    difficulty,
  });

  const interview = await Interview.create({
    candidate: userId,
    title,
    jobDescription,
    round,
    difficulty,
    questions,
    status: 'scheduled',
  });

  return interview;
};

exports.submitAnswer = async ({ interviewId, questionId, answer, userId }) => {
  const interview = await Interview.findOne({ _id: interviewId, candidate: userId });
  if (!interview) throw new AppError('Interview not found.', 404);

  const question = interview.questions.id(questionId);
  if (!question) throw new AppError('Question not found.', 404);

  // AI evaluation
  const evaluation = await gemini.evaluateAnswer({
    question: question.text,
    answer,
    expectedKeywords: question.expectedKeywords,
    round: interview.round,
  });

  // Check if answer already exists
  const existingIdx = interview.answers.findIndex(
    (a) => a.questionId?.toString() === questionId
  );

  const answerData = {
    questionId,
    question: question.text,
    answer,
    aiEvaluation: evaluation,
  };

  if (existingIdx >= 0) {
    interview.answers[existingIdx] = answerData;
  } else {
    interview.answers.push(answerData);
  }

  // Adaptive difficulty: if score < 4, keep easy; if > 7, increase difficulty
  if (evaluation.score < 4 && interview.difficulty !== 'easy') {
    interview.difficulty = 'easy';
  } else if (evaluation.score > 7 && interview.difficulty === 'easy') {
    interview.difficulty = 'medium';
  } else if (evaluation.score > 7 && interview.difficulty === 'medium') {
    interview.difficulty = 'hard';
  }

  if (interview.status === 'scheduled') interview.status = 'in_progress';
  await interview.save();

  return { evaluation, currentDifficulty: interview.difficulty };
};

exports.completeInterview = async ({ interviewId, userId, duration }) => {
  const interview = await Interview.findOne({ _id: interviewId, candidate: userId });
  if (!interview) throw new AppError('Interview not found.', 404);

  // Generate scorecard
  const scorecard = await gemini.generateScorecard({
    answers: interview.answers,
    round: interview.round,
    jobDescription: interview.jobDescription,
  });

  interview.scorecard = scorecard;
  interview.status = 'completed';
  interview.duration = duration || 0;
  await interview.save();

  // Update user stats and memory
  const user = await User.findById(userId);
  user.totalInterviews += 1;
  const allInterviews = await Interview.find({ candidate: userId, status: 'completed' });
  const avgScore =
    allInterviews.reduce((sum, i) => sum + (i.scorecard?.overallScore || 0), 0) /
    allInterviews.length;
  user.averageScore = Math.round(avgScore * 10) / 10;

  // Update weak topics from improvements
  if (scorecard.improvements?.length) {
    scorecard.improvements.forEach((imp) => {
      if (!user.weakTopics.includes(imp)) user.weakTopics.push(imp);
    });
    if (user.weakTopics.length > 10) user.weakTopics = user.weakTopics.slice(-10);
  }

  // Memory system
  user.interviewMemory.push({
    topic: interview.title,
    performance: scorecard.overallScore >= 6 ? 'strong' : 'weak',
    notes: scorecard.aiSummary,
  });
  if (user.interviewMemory.length > 20) user.interviewMemory.shift();

  await user.save({ validateBeforeSave: false });

  return interview;
};

exports.getInterviewById = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, candidate: userId }).populate(
    'candidate',
    'name email avatar'
  );
  if (!interview) throw new AppError('Interview not found.', 404);
  return interview;
};

exports.getUserInterviews = async (userId, { page = 1, limit = 10, round, status } = {}) => {
  const filter = { candidate: userId };
  if (round) filter.round = round;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [interviews, total] = await Promise.all([
    Interview.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Interview.countDocuments(filter),
  ]);

  return { interviews, total, page, pages: Math.ceil(total / limit) };
};

exports.askFollowUp = async ({ interviewId, questionId, followUp, userId }) => {
  const interview = await Interview.findOne({ _id: interviewId, candidate: userId });
  if (!interview) throw new AppError('Interview not found.', 404);

  const answer = interview.answers.find((a) => a.questionId?.toString() === questionId);
  if (!answer) throw new AppError('Answer not found.', 404);

  const geminiService = require('./gemini.service');
  const model = geminiService;

  // Use Gemini to answer follow-up
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
Interview context:
Question: ${answer.question}
Candidate's answer: ${answer.answer}
AI feedback: ${answer.aiEvaluation?.feedback}

Follow-up from candidate: "${followUp}"

Respond helpfully as an interview coach. Be specific and constructive.`;

  const result = await geminiModel.generateContent(prompt);
  return { response: result.response.text() };
};
