import api from './api';

export const getCandidates = (params) => api.get('/recruiter/candidates', { params });
export const getCandidateDetail = (id) => api.get(`/recruiter/candidates/${id}`);
export const getCandidateInterviews = (id) => api.get(`/recruiter/candidates/${id}/interviews`);
export const getAnalytics = () => api.get('/recruiter/analytics');
