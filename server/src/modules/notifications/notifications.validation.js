import { z } from 'zod';

export const sendNotificationSchema = z.object({
  athleteId: z.number().int().positive(),
  channel: z.enum(['email', 'whatsapp']),
  recipient: z.string().min(3),
  customMessage: z.string().max(1000).optional(),
});
