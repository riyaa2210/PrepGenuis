require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth.routes');
const interviewRoutes = require('./routes/interview.routes');
const resumeRoutes = require('./routes/resume.routes');
const pdfRoutes = require('./routes/pdf.routes');
const recruiterRoutes = require('./routes/recruiter.routes');
const progressRoutes = require('./routes/progress.routes');
const hiringAnalysisRoutes = require('./routes/hiringAnalysis.routes');
const candidateRankingRoutes = require('./routes/candidateRanking.routes');
const intelligenceEngineRoutes = require('./routes/intelligenceEngine.routes');
const aiCoachRoutes            = require('./routes/aiCoach.routes');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'https://prepgenuis.onrender.com',
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);

// Connect to MongoDB
connectDB();

// Core middleware
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'https://prepgenuis.onrender.com',  // deployed frontend
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// Static uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/hiring-analysis', hiringAnalysisRoutes);
app.use('/api/candidate-ranking', candidateRankingRoutes);
app.use('/api/intelligence', intelligenceEngineRoutes);
app.use('/api/coach',        aiCoachRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Socket.io real-time feedback
require('./sockets/interviewSocket')(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { app, server };
