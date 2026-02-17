import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
    getAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    getInventoryStats,
    getAvailableAssetsForEvent,
    installAsset,
    dismantleAsset
} from '../controllers/inventory.controller.js';
import { cloneAsset } from '../controllers/assetTemplate.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Standard REST routes
router.get('/stats', getInventoryStats);
router.get('/items/available', getAvailableAssetsForEvent);
router.get('/', getAssets);
router.get('/items', getAssets);
router.post('/', createAsset);
router.post('/items', createAsset);

// Clone
router.post('/items/:id/clone', cloneAsset);

// Panel Actions
router.post('/:id/install', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), installAsset);
router.post('/:id/dismantle', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), dismantleAsset);

// Specific asset routes (Order matters: specific paths before :id)
router.get('/:id', getAssetById);
router.get('/items/:id', getAssetById);
router.patch('/:id', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'supervisor'), updateAsset);
router.put('/:id', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'supervisor'), updateAsset);
router.put('/items/:id', updateAsset);
router.delete('/:id', protect, authorize('admin', 'superuser'), deleteAsset);
router.delete('/items/:id', deleteAsset);



export default router;
