import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
    getAllRolePermissions,
    updateRolePermissions,
    resetRolePermissions
} from '../controllers/rolePermission.controller.js';

const router = express.Router();

router.use(protect, authorize('superuser', 'system_admin', 'admin'));

router.get('/', getAllRolePermissions);
router.put('/:slug', updateRolePermissions);
router.delete('/:slug', resetRolePermissions);

export default router;
