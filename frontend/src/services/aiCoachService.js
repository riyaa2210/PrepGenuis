import api from './api';

export const getRealTimeFeedback  = (answerChunk)  => api.post('/coach/feedback',    { answerChunk });
export const getLearningRoadmap   = (data)          => api.post('/coach/roadmap',     data);
export const getMultiRoundQuestions = (data)        => api.post('/coach/multi-round', data);
export const getMemoryInterview   = (data)          => api.post('/coach/memory',      data);
