import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './users.validation.js';
import { listHandler, createHandler, updateHandler, directoryHandler } from './users.controller.js';

const router = Router();

// Directory is intentionally available to any authenticated user (not just
// admins) - staff need it to populate the "Assigned Officer" picker on the
// athlete form. It returns only id/name/role, never email or account status,
// so it doesn't leak the admin-only user-management data below.
router.get('/directory', requireAuth, directoryHandler);

// Everything else - full user management - is administrator-only.
router.use(requireAuth, requireRole('administrator'));

router.get('/', listHandler);
router.post('/', validate(createUserSchema), createHandler);
router.patch('/:id', validate(updateUserSchema), updateHandler);

export default router;
