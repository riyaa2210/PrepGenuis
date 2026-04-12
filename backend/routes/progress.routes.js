const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', progressController.getProgress);

module.exports = router;
