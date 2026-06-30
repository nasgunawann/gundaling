import axios from 'axios';
import { io } from 'socket.io-client';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gundaling_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const initSocket = (token) => {
  const socket = io(`http://${window.location.hostname}:8000`, {
    auth: {
      token,
    },
  });
  return socket;
};

export default api;
