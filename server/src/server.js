import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { attachSockets } from './sockets/index.js';
import { startAppointmentReminderJob } from './jobs/appointmentReminder.job.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: env.clientOrigin, credentials: true },
});
attachSockets(io);
app.set('io', io); // controllers read this to emit real-time events after a mutation

httpServer.listen(env.port, () => {
  logger.info(`Server listening on port ${env.port}`, { env: env.nodeEnv });
  startAppointmentReminderJob();
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
