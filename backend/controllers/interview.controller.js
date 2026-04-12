const interviewService = require('../services/interview.service');
const gemini = require('../services/gemini.service');

exports.createInterview = async (req, res) => {
  const { title, jobDescription, round, difficulty } = req.body;
  const interview = await interviewService.createInterview({
    userId: req.user._id,
    title,
    jobDescription,
    round: round || 'mock',
    difficulty: difficulty || 'easy',
  });
  res.status(201).json({ success: true, interview });
};

exports.getInterviews = async (req, res) => {
  const result = await interviewService.getUserInterviews(req.user._id, req.query);
  res.json({ success: true, ...result });
};

exports.getInterview = async (req, res) => {
  const interview = await interviewService.getInterviewById(req.params.id, req.user._id);
  res.json({ success: true, interview });
};

exports.submitAnswer = async (req, res) => {
  const { questionId, answer } = req.body;
  const result = await interviewService.submitAnswer({
    interviewId: req.params.id,
    questionId,
    answer,
    userId: req.user._id,
  });
  res.json({ success: true, ...result });
};

exports.completeInterview = async (req, res) => {
  const { duration } = req.body;
  const interview = await interviewService.completeInterview({
    interviewId: req.params.id,
    userId: req.user._id,
    duration,
  });
  res.json({ success: true, interview });
};

exports.askFollowUp = async (req, res) => {
  const { questionId, followUp } = req.body;
  const result = await interviewService.askFollowUp({
    interviewId: req.params.id,
    questionId,
    followUp,
    userId: req.user._id,
  });
  res.json({ success: true, ...result });
};

exports.getRealTimeFeedback = async (req, res) => {
  const { transcript } = req.body;
  const feedback = await gemini.getRealTimeFeedback(transcript);
  res.json({ success: true, ...feedback });
};

exports.submitCodingSolution = async (req, res) => {
  const { problemIndex, solution, language } = req.body;
  const Interview = require('../models/Interview.model');
  const interview = await Interview.findOne({ _id: req.params.id, candidate: req.user._id });
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

  const problem = interview.codingProblems[problemIndex];
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

  const evaluation = await gemini.evaluateCodingSolution({
    problem: problem.description,
    solution,
    language,
  });

  interview.codingProblems[problemIndex].solution = solution;
  interview.codingProblems[problemIndex].aiEvaluation = evaluation;
  await interview.save();

  res.json({ success: true, evaluation });
};

exports.getLearningRoadmap = async (req, res) => {
  const { role } = req.query;
  const user = req.user;
  const roadmap = await gemini.generateLearningRoadmap({
    weakTopics: user.weakTopics || [],
    role,
  });
  res.json({ success: true, ...roadmap });
};
