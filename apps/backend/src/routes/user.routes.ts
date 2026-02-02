import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getUser, updateUserPermissions } from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

// Custom permissions route
router.route('/:id/permissions')
    .put(protect, authorize('admin', 'superuser'), updateUserPermissions);

export default router;
