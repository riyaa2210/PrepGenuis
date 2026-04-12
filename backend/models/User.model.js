const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['candidate', 'recruiter', 'admin'], default: 'candidate' },
    googleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    refreshTokens: [{ type: String }],
    // Resume reference
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    // Progress tracking
    totalInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    weakTopics: [{ type: String }],
    // Memory system
    interviewMemory: [
      {
        topic: String,
        performance: String, // 'strong' | 'weak'
        notes: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
