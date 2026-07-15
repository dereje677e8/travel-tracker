import { api } from './axiosClient.js';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
};
