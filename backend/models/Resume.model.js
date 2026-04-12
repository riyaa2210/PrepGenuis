const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String },
    filePath: { type: String },
    rawText: { type: String },
    parsed: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      location: { type: String },
      summary: { type: String },
      skills: [{ type: String }],
      experience: [
        {
          company: String,
          role: String,
          duration: String,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          year: String,
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          link: String,
        },
      ],
      certifications: [{ type: String }],
    },
    skillTags: [{ type: String }],
    atsScore: { type: Number, min: 0, max: 100 },
    atsFeedback: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
