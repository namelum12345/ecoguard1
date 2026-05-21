import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  registerCitizen,
  loginCitizen,
  loginAdmin,
  me,
  updateMe,
  changePassword,
  myStats,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/citizen/register', registerCitizen);
router.post('/citizen/login', loginCitizen);
router.post('/admin/login', loginAdmin);

router.get('/me',          authenticate, me);
router.patch('/me',        authenticate, updateMe);
router.post('/me/password', authenticate, changePassword);
router.get('/me/stats',    authenticate, myStats);

export default router;
