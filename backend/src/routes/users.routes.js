import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  listUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  usersSummary,
} from '../controllers/users.controller.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/summary', usersSummary);
router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUserById);
router.delete('/:id', deleteUserById);

export default router;
