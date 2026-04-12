import api from './api';

export const getCandidatePool  = (params) => api.get('/candidate-ranking/candidates', { params });
export const rankCandidates    = (data)   => api.post('/candidate-ranking', data);
