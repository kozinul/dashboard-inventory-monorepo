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
    dismantleAsset,
    bulkDeleteAssets,
    requestDeleteAsset,
    approveDeleteAsset,
    rejectDeleteAsset
} from '../controllers/inventory.controller.js';
import { checkPermission } from '../middleware/permission.middleware.js';
import { cloneAsset, bulkCloneAssets } from '../controllers/assetTemplate.controller.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Standard REST routes
router.get('/stats', getInventoryStats);
router.get('/items/available', getAvailableAssetsForEvent);
router.get('/', getAssets);
router.get('/items', getAssets);
router.post('/', checkPermission('inventory', 'create'), createAsset);
router.post('/items', checkPermission('inventory', 'create'), createAsset);

// Clone
router.post('/:id/clone', cloneAsset);
router.post('/items/:id/clone', cloneAsset);
router.post('/:id/clone-bulk', bulkCloneAssets);
router.post('/items/:id/clone-bulk', bulkCloneAssets);

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

// Delete Request Routes (any authenticated user can request; only delete-privileged users can approve/reject)
router.put('/items/:id/request-delete', requestDeleteAsset);
router.put('/:id/request-delete', requestDeleteAsset);
router.put('/items/:id/approve-delete', checkPermission('inventory', 'delete'), approveDeleteAsset);
router.put('/:id/approve-delete', checkPermission('inventory', 'delete'), approveDeleteAsset);
router.put('/items/:id/reject-delete', checkPermission('inventory', 'delete'), rejectDeleteAsset);
router.put('/:id/reject-delete', checkPermission('inventory', 'delete'), rejectDeleteAsset);

// Bulk Delete (Must be before specific ID routes that use DELETE)
router.post('/items/bulk-delete', checkPermission('inventory', 'delete'), bulkDeleteAssets);

router.delete('/:id', checkPermission('inventory', 'delete'), deleteAsset);
router.delete('/items/:id', checkPermission('inventory', 'delete'), deleteAsset);



export default router;
