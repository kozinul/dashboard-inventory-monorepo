import express from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branch.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getBranches);
router.post('/', authorize('superuser', 'admin', 'system_admin'), createBranch);
router.put('/:id', authorize('superuser', 'admin', 'system_admin'), updateBranch);
router.delete('/:id', authorize('superuser', 'admin', 'system_admin'), deleteBranch);

export default router;
