import express from 'express';
import {
    getUsers,
    getTechnicians,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions
} from '../controllers/user.controller.js';
import { checkPermission, checkAnyPermission } from '../middleware/permission.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkAnyPermission(['users', 'assignments', 'maintenance', 'rental', 'dept_tickets'], 'view'), getUsers);
router.get('/technicians', getTechnicians);
router.post('/', checkPermission('users', 'create'), createUser);
router.get('/:id', checkPermission('users', 'view'), getUser);
router.put('/:id', checkPermission('users', 'edit'), updateUser);
router.delete('/:id', checkPermission('users', 'delete'), deleteUser);
router.put('/:id/permissions', checkPermission('users', 'edit'), updateUserPermissions);

export default router;
