import axios from 'axios';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url?.includes('/login') || config.url?.includes('/logout');
  if (!isAuthEndpoint && typeof window !== 'undefined') {
    const token = Cookies.get('mfids_token');
    if (token && config.headers) {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        Cookies.remove('mfids_token');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;