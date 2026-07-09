import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
    createStockOpname, getStockOpnames, getStockOpnameDetail, 
    startStockOpname, verifyStockOpnameItem, setOpnameToReview, reopenStockOpname, completeStockOpname,
    deleteStockOpname, exportStockOpnameExcel, importStockOpnameExcel,
    cleanupStockOpname, getStockOpnameByAsset
} from '../controllers/stockOpname.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/by-asset/:assetId', getStockOpnameByAsset);
router.post('/', authorize('superuser', 'admin', 'system_admin', 'manager', 'dept_admin'), createStockOpname);
router.get('/', getStockOpnames);
router.get('/:id', getStockOpnameDetail);
router.put('/:id/start', authorize('superuser', 'admin', 'system_admin', 'manager', 'dept_admin'), startStockOpname);
router.put('/items/:itemId', verifyStockOpnameItem);
router.put('/:id/review', authorize('superuser', 'admin', 'system_admin', 'manager'), setOpnameToReview);
router.put('/:id/reopen', authorize('superuser', 'admin', 'system_admin', 'manager'), reopenStockOpname);
router.put('/:id/complete', authorize('superuser', 'admin', 'system_admin', 'manager'), completeStockOpname);
router.delete('/:id', authorize('superuser', 'admin', 'system_admin'), deleteStockOpname);

router.post('/cleanup', authorize('superuser', 'admin', 'system_admin'), cleanupStockOpname);

router.get('/:id/export', exportStockOpnameExcel);
router.post('/:id/import', authorize('superuser', 'admin', 'system_admin', 'manager'), upload.single('file'), importStockOpnameExcel);

export default router;
