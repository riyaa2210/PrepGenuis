const path = require('path');
const pdfService = require('../services/pdf.service');
const Resume = require('../models/Resume.model');
const Interview = require('../models/Interview.model');
const AppError = require('../utils/AppError');

exports.generateResumePDF = async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) throw new AppError('No resume found. Please upload your resume first.', 404);

  const filePath = await pdfService.generateResumePDF(resume);
  res.download(filePath, 'resume.pdf');
};

exports.generateReportPDF = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    candidate: req.user._id,
  }).populate('candidate', 'name email');

  if (!interview) throw new AppError('Interview not found.', 404);
  if (interview.status !== 'completed') throw new AppError('Interview not completed yet.', 400);

  const filePath = await pdfService.generateInterviewReportPDF(interview);
  res.download(filePath, `interview-report-${interview._id}.pdf`);
};
