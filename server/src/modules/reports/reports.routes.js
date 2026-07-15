import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { excelHandler, pdfHandler } from './reports.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/export.xlsx', excelHandler);
router.get('/export.pdf', pdfHandler);
export default router;
