const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.post('/upload', upload.single('resume'), resumeController.uploadResume);
router.get('/', resumeController.getResume);
router.delete('/', resumeController.deleteResume);

module.exports = router;
