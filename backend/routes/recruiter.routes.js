const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiter.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('recruiter', 'admin'));

router.get('/candidates', recruiterController.getCandidates);
router.get('/candidates/:id', recruiterController.getCandidateDetail);
router.get('/candidates/:id/interviews', recruiterController.getCandidateInterviews);
router.get('/analytics', recruiterController.getAnalytics);

module.exports = router;
