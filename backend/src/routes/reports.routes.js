import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';
import {
  createReport,
  listReports,
  getReport,
  updateReport,
  rateReport,
  statsReports,
  analyticsReports,
} from '../controllers/reports.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats',     requireRole('admin'), statsReports);
router.get('/analytics', requireRole('admin'), analyticsReports);

router.get('/',    listReports);
router.get('/:id', getReport);

router.post('/',          requireRole('citizen'), upload.single('image'), createReport);
router.post('/:id/rate',  requireRole('citizen'), rateReport);

router.patch('/:id', requireRole('admin'), updateReport);

export default router;
