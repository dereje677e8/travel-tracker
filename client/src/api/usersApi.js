import { api } from './axiosClient.js';

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data.data),
  directory: () => api.get('/users/directory').then((r) => r.data.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/users/${id}`, payload).then((r) => r.data.data),
  resetPassword: (id, newPassword) => api.post(`/users/${id}/reset-password`, newPassword ? { newPassword } : {}).then((r) => r.data.data),
};
