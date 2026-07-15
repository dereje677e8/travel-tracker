import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { listRecentHandler } from './activityLog.controller.js';

const router = Router();

// No PATCH/DELETE routes here by design - the log is immutable.
router.get('/', requireAuth, listRecentHandler);

export default router;
