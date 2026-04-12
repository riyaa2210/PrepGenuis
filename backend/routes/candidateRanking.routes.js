const express = require('express');
const router  = express.Router();
const { rankCandidates, getCandidatePool } = require('../controllers/candidateRanking.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('recruiter', 'admin'));

router.get('/candidates', getCandidatePool);
router.post('/', rankCandidates);

module.exports = router;
