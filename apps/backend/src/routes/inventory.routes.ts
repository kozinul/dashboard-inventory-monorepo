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
import { checkPermission } from '../middleware/permission.middleware.js';
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
router.post('/:id/clone', cloneAsset);
router.post('/items/:id/clone', cloneAsset);

// Panel Actions
router.post('/:id/install', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), installAsset);
router.post('/items/:id/install', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), installAsset);
router.post('/:id/dismantle', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), dismantleAsset);
router.post('/items/:id/dismantle', protect, authorize('manager', 'admin', 'superuser', 'dept_admin', 'technician'), dismantleAsset);

// Specific asset routes (Order matters: specific paths before :id)
router.get('/:id', getAssetById);
router.get('/items/:id', getAssetById);
router.patch('/:id', checkPermission('inventory', 'edit'), updateAsset);
router.put('/:id', checkPermission('inventory', 'edit'), updateAsset);
router.put('/items/:id', checkPermission('inventory', 'edit'), updateAsset);
router.delete('/:id', checkPermission('inventory', 'delete'), deleteAsset);
router.delete('/items/:id', checkPermission('inventory', 'delete'), deleteAsset);



export default router;
