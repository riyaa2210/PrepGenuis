import api from './api';

export const createInterview = (data) => api.post('/interviews', data);
export const getInterviews = (params) => api.get('/interviews', { params });
export const getInterview = (id) => api.get(`/interviews/${id}`);
export const submitAnswer = (id, data) => api.post(`/interviews/${id}/answer`, data);
export const completeInterview = (id, data) => api.post(`/interviews/${id}/complete`, data);
export const askFollowUp = (id, data) => api.post(`/interviews/${id}/followup`, data);
export const submitCodingSolution = (id, data) => api.post(`/interviews/${id}/coding`, data);
export const getRealTimeFeedback = (transcript) =>
  api.post('/interviews/feedback/realtime', { transcript });
export const getLearningRoadmap = (role) => api.get('/interviews/roadmap', { params: { role } });
