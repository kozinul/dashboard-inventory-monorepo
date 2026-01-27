import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);

export default router;
