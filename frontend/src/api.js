// Centralised axios instance — automatically attaches the JWT token
// from localStorage to every request as a Bearer header.

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
});

// Attach token before every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Only redirect to /login on 401 for PROTECTED routes, not auth endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const authRoutes = ['/login', '/signup', '/google-login', '/forgot-password', '/reset-password'];
    const isAuthRoute = authRoutes.some((r) => url.endsWith(r));

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('firstName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
