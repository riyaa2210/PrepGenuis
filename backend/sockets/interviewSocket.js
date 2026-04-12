const logger = require('../config/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join interview room
    socket.on('join_interview', ({ interviewId }) => {
      socket.join(`interview:${interviewId}`);
      logger.info(`Socket ${socket.id} joined interview:${interviewId}`);
    });

    // Real-time transcript feedback
    socket.on('transcript_chunk', async ({ interviewId, transcript }) => {
      try {
        const aiCoach = require('../services/aiCoach.service');
        const feedback = await aiCoach.getRealTimeFeedback(transcript);
        socket.emit('realtime_feedback', feedback);
      } catch (err) {
        logger.error('Real-time feedback error:', err.message);
      }
    });

    // Typing indicator for follow-up chat
    socket.on('typing', ({ interviewId }) => {
      socket.to(`interview:${interviewId}`).emit('user_typing');
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
