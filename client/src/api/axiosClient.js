import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({ baseURL: `${baseURL}/api` });

// Access token is kept in memory (module scope) rather than localStorage -
// a page refresh re-derives it via the refresh token flow in AuthContext.
let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// On a 401, let the caller (AuthContext) decide whether to attempt a
// refresh or log out - this interceptor only normalizes the error shape.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'Request failed';
    const code = err.response?.data?.error?.code;
    const fields = err.response?.data?.error?.fields;
    const status = err.response?.status;
    return Promise.reject({ message, code, fields, status, raw: err });
  }
);
