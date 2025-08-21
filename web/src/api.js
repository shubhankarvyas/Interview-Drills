import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export const authAPI = {
  me: () => api.get('/api/me'),
  logout: () => api.post('/auth/logout')
};

export const drillsAPI = {
  getAll: () => api.get('/api/drills'),
  getById: (id) => api.get(`/api/drills/${id}`)
};

export const attemptsAPI = {
  create: (data) => api.post('/api/attempts', data),
  getHistory: (limit = 5) => api.get(`/api/attempts?limit=${limit}`)
};

export const analyticsAPI = {
  getStats: () => api.get('/api/analytics')
};

export default api;
