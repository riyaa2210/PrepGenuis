const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/intelligenceEngine.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/ats',      ctrl.analyzeATS);
router.post('/speech',   ctrl.analyzeSpeech);
router.post('/behavior', ctrl.analyzeBehavior);
router.post('/full',     ctrl.analyzeFullInterview);

module.exports = router;
