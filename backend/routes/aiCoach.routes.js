const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/aiCoach.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/feedback',       ctrl.realTimeFeedback);   // 6. Real-time
router.post('/roadmap',        ctrl.learningRoadmap);    // 8. Roadmap
router.post('/multi-round',    ctrl.multiRoundInterview);// 9. Multi-round
router.post('/memory',         ctrl.memoryInterview);    // 10. Memory RAG

module.exports = router;
