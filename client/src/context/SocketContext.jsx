import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/axiosClient.js';

const SocketContext = createContext(null);

/**
 * One socket connection per session, authenticated with the current access
 * token. Components subscribe via useSocket() and add their own listeners;
 * this provider only owns connection lifecycle, not event handling.
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket((s) => { s?.disconnect(); return null; });
      return;
    }
    const token = getAccessToken();
    if (!token) return undefined;
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const s = io(baseURL, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
