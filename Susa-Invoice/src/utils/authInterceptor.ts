// src/utils/authInterceptor.ts
import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios'; // 👈 type-only import

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('refreshToken');

  if (token) {
    // safely cast headers to AxiosRequestHeaders
    if (config.headers) {
      (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
    } else {
      config.headers = {
        Authorization: `Bearer ${token}`,
      } as AxiosRequestHeaders;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});
