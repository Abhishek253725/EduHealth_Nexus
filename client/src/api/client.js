import axios from 'axios';

const api = axios.create({
  // ✅ Proxy use karo - localhost:5000 directly nahi
  baseURL: '/api', // Vite proxy handle karega
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;