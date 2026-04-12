import api from './api';

export const uploadResume = (formData) =>
  api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getResume = () => api.get('/resume');
export const deleteResume = () => api.delete('/resume');
