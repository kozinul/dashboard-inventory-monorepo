import express from 'express';
import { login, getMe, updateMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
