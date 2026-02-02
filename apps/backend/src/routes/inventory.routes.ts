import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    getInventoryStats
} from '../controllers/inventory.controller.js';
import { cloneAsset } from '../controllers/assetTemplate.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.get('/items', getAssets);
router.get('/items/:id', getAssetById);
router.post('/items', createAsset);
router.put('/items/:id', updateAsset);
router.delete('/items/:id', deleteAsset);
router.post('/items/:id/clone', cloneAsset);
router.get('/stats', getInventoryStats);

export default router;
