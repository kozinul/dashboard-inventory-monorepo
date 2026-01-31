import express from 'express';
import {
    getMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    getMaintenanceStats,
    deleteMaintenanceRecord
} from '../controllers/maintenance.controller.js';

const router = express.Router();

router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.get('/stats', getMaintenanceStats);
router.delete('/:id', deleteMaintenanceRecord);

export default router;
