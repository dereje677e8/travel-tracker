import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * All athlete/requirement mutations go through REST first (validated,
 * transactional) and then emit an event here for connected clients to
 * reconcile their view - sockets are never a separate, unvalidated write
 * path. See athlete.service.js for the emit calls.
 */
export function attachSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('socket connected', { userId: socket.user?.id });
    socket.on('disconnect', () => logger.info('socket disconnected', { userId: socket.user?.id }));
  });
}
