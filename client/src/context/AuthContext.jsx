import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi.js';
import { setAccessToken } from '../api/axiosClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, accessToken, refreshToken } = await authApi.login(email, password);
    setAccessToken(accessToken);
    sessionStorage.setItem('attp_refresh_token', refreshToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    sessionStorage.removeItem('attp_refresh_token');
    setUser(null);
  }, []);

  // On mount, try to silently re-establish a session from the refresh token
  // (survives a page reload without forcing a re-login every time).
  useEffect(() => {
    async function bootstrap() {
      const refreshToken = sessionStorage.getItem('attp_refresh_token');
      if (!refreshToken) {
        setInitializing(false);
        return;
      }
      try {
        const { accessToken } = await authApi.refresh(refreshToken);
        setAccessToken(accessToken);
        const me = await authApi.me();
        setUser(me);
      } catch {
        sessionStorage.removeItem('attp_refresh_token');
      } finally {
        setInitializing(false);
      }
    }
    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
