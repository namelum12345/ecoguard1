import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listNotifications, markAllRead, markRead } from '../controllers/notifications.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',            listNotifications);
router.post('/read-all',   markAllRead);
router.post('/:id/read',   markRead);

export default router;
