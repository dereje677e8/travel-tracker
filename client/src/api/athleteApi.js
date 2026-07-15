import { api } from './axiosClient.js';

export const athleteApi = {
  list: (params) => api.get('/athletes', { params }).then((r) => r.data),
  detail: (id) => api.get(`/athletes/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/athletes', payload).then((r) => r.data.data),
  update: (id, payload) => api.patch(`/athletes/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/athletes/${id}`).then((r) => r.data.data),
  updateRequirement: (id, key, payload) =>
    api.patch(`/athletes/${id}/requirements/${key}`, payload).then((r) => r.data.data),
  destinations: () => api.get('/athletes/destinations').then((r) => r.data.data),
};
