import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendNotificationSchema } from './notifications.validation.js';
import { sendHandler, historyHandler } from './notifications.controller.js';

const router = Router();
router.use(requireAuth);

// Spec: "The administrator can send updates" - restrict sending to administrators.
router.post('/', requireRole('administrator'), validate(sendNotificationSchema), sendHandler);
router.get('/athlete/:athleteId', historyHandler);

export default router;
