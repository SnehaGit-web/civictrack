import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;