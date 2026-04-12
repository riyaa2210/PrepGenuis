import api from './api';

export const analyzeSelf = () => api.post('/hiring-analysis/self');
export const analyzeCandidate = (candidateId) => api.post(`/hiring-analysis/${candidateId}`);
