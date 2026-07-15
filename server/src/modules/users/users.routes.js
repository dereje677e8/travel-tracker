import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './users.validation.js';
import { listHandler, createHandler, updateHandler } from './users.controller.js';

const router = Router();

// User management is administrator-only across the board.
router.use(requireAuth, requireRole('administrator'));

router.get('/', listHandler);
router.post('/', validate(createUserSchema), createHandler);
router.patch('/:id', validate(updateUserSchema), updateHandler);

export default router;
