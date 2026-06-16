import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const api = axios.create({
  baseURL: '',
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
  // Inject X-Socket-ID if Laravel Echo is initialized and connected
  if (window.Echo && typeof window.Echo.socketId === 'function' && window.Echo.socketId()) {
    config.headers['X-Socket-ID'] = window.Echo.socketId();
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const initEcho = (token) => {
  return new Echo({
    broadcaster: 'reverb',
    key: 'gundalingkey',
    wsHost: window.location.hostname,
    wsPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};

export default api;
