import { api } from './axiosClient.js';

export const notificationsApi = {
  send: (payload) => api.post('/notifications', payload).then((r) => r.data.data),
  history: (athleteId) => api.get(`/notifications/athlete/${athleteId}`).then((r) => r.data.data),
};
