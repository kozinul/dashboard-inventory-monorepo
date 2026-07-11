import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getSupplyMutationReport, exportSupplyMutationExcel, getCategorySummary } from '../controllers/report.controller.js';

const router = express.Router();

router.use(protect);

router.get('/supply-mutation', getSupplyMutationReport);
router.get('/supply-mutation/export', exportSupplyMutationExcel);
router.get('/category-summary', getCategorySummary);

export default router;
