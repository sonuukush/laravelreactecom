import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach authentication token and guest token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add guest token if available
    let guestToken = localStorage.getItem('guest_token');
    if (!guestToken) {
      guestToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('guest_token', guestToken);
    }
    config.headers['X-Guest-Token'] = guestToken;

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
