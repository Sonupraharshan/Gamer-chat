import axios from 'axios';
import { API_URL } from '../config';

const instance = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to attach token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;

