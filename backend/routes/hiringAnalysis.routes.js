const express = require('express');
const router = express.Router();
const { analyzeCandidate, analyzeSelf } = require('../controllers/hiringAnalysis.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Candidate self-analysis
router.post('/self', protect, analyzeSelf);

// Recruiter / admin analysis of any candidate
router.post('/:candidateId', protect, restrictTo('recruiter', 'admin'), analyzeCandidate);

module.exports = router;
