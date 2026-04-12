const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/resume', pdfController.generateResumePDF);
router.get('/report/:id', pdfController.generateReportPDF);

module.exports = router;
