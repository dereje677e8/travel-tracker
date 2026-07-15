import { api } from './axiosClient.js';

export const activityLogApi = {
  recent: (limit = 50) => api.get('/activity-log', { params: { limit } }).then((r) => r.data.data),
};
