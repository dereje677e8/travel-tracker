import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { eventsHandler } from './calendar.controller.js';

const router = Router();
router.get('/events', requireAuth, eventsHandler);
export default router;
