import { api } from './axiosClient.js';

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/users/${id}`, payload).then((r) => r.data.data),
};
