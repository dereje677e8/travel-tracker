import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export function useSocketEvent(eventName, handler) {
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return undefined;
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName]);
}
