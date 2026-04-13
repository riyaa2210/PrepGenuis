import api from './api';

export const uploadResume = (formData) =>
  // Do NOT set Content-Type manually — axios sets it with the correct boundary
  api.post('/resume/upload', formData);

export const getResume = () => api.get('/resume');
export const deleteResume = () => api.delete('/resume');
