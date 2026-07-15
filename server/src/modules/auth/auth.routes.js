import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginSchema, refreshSchema } from './auth.validation.js';
import { loginHandler, refreshHandler, meHandler } from './auth.controller.js';

const router = Router();

// Blunt brute-force attempts on auth endpoints specifically.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post('/login', authLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', authLimiter, validate(refreshSchema), refreshHandler);
router.get('/me', requireAuth, meHandler);

export default router;
