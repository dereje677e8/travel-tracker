import { api } from './axiosClient.js';

export const calendarApi = {
  events: (start, end) => api.get('/calendar/events', { params: { start, end } }).then((r) => r.data.data),
};
