const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', interviewController.createInterview);
router.get('/', interviewController.getInterviews);
router.get('/roadmap', interviewController.getLearningRoadmap);
router.get('/:id', interviewController.getInterview);
router.post('/:id/answer', interviewController.submitAnswer);
router.post('/:id/complete', interviewController.completeInterview);
router.post('/:id/followup', interviewController.askFollowUp);
router.post('/:id/coding', interviewController.submitCodingSolution);
router.post('/feedback/realtime', interviewController.getRealTimeFeedback);

module.exports = router;
