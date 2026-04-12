import api from './api';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const googleLogin = (idToken) => api.post('/auth/google', { idToken });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/me', data);
