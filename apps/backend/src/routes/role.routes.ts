import express from 'express';
import {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
} from '../controllers/role.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All role routes should be protected and restricted to admins/superusers initially
// Later we can refine this to use dynamic permissions themselves (e.g., 'roles.view', 'roles.create')
router.route('/')
    .get(protect, authorize('admin', 'superuser'), getRoles)
    .post(protect, authorize('admin', 'superuser'), createRole);

router.route('/:id')
    .get(protect, authorize('admin', 'superuser'), getRoleById)
    .put(protect, authorize('admin', 'superuser'), updateRole)
    .delete(protect, authorize('admin', 'superuser'), deleteRole);

export default router;
