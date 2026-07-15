import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  athleteInputSchema, athletePatchSchema, requirementUpdateSchema, listQuerySchema,
} from './athlete.validation.js';
import {
  listHandler, detailHandler, createHandler, updateHandler, deleteHandler,
  updateRequirementHandler, destinationsHandler,
} from './athlete.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listQuerySchema, 'query'), listHandler);
router.get('/destinations', destinationsHandler);
router.get('/:id', detailHandler);
router.post('/', validate(athleteInputSchema), createHandler);
router.patch('/:id', validate(athletePatchSchema), updateHandler);
// Deletion is administrator-only; staff can view/update but not remove records.
router.delete('/:id', requireRole('administrator'), deleteHandler);
router.patch('/:id/requirements/:requirementKey', validate(requirementUpdateSchema), updateRequirementHandler);

export default router;
