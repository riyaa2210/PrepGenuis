import api from './api';

export const analyzeATS      = (data) => api.post('/intelligence/ats',      data);
export const analyzeSpeech   = (data) => api.post('/intelligence/speech',   data);
export const analyzeBehavior = (data) => api.post('/intelligence/behavior', data);
export const analyzeFullInterview = (data) => api.post('/intelligence/full', data);
