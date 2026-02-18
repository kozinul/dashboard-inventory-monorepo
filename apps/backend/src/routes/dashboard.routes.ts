import express from 'express';
import { getDashboardStats, getRecentActivity, getLowStockSupplies } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/low-stock', getLowStockSupplies);

export default router;
