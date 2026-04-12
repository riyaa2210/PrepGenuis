const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  audioUrl: { type: String },
  videoUrl: { type: String },
  aiEvaluation: {
    score: { type: Number, min: 0, max: 10 },
    feedback: { type: String },
    betterAnswer: { type: String },
    fillerWords: [{ type: String }],
    fillerWordCount: { type: Number, default: 0 },
  },
  timeSpent: { type: Number, default: 0 }, // seconds
});

const scorecardSchema = new mongoose.Schema({
  communicationScore: { type: Number, min: 0, max: 10, default: 0 },
  technicalScore: { type: Number, min: 0, max: 10, default: 0 },
  confidenceScore: { type: Number, min: 0, max: 10, default: 0 },
  clarityScore: { type: Number, min: 0, max: 10, default: 0 },
  overallScore: { type: Number, min: 0, max: 10, default: 0 },
  fillerWordsDetected: [{ type: String }],
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  aiSummary: { type: String },
});

const interviewSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    jobDescription: { type: String },
    round: {
      type: String,
      enum: ['hr', 'technical', 'managerial', 'coding', 'mock'],
      default: 'mock',
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    questions: [
      {
        text: { type: String, required: true },
        category: { type: String },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        expectedKeywords: [{ type: String }],
      },
    ],
    answers: [answerSchema],
    scorecard: scorecardSchema,
    duration: { type: Number, default: 0 }, // total seconds
    recordingUrl: { type: String },
    // Coding interview
    codingProblems: [
      {
        title: String,
        description: String,
        difficulty: String,
        starterCode: String,
        solution: String,
        aiEvaluation: {
          score: Number,
          feedback: String,
          timeComplexity: String,
          spaceComplexity: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
