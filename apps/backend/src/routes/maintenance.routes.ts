import express from 'express';
import {
    getMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    getMaintenanceStats
} from '../controllers/maintenance.controller.js';

const router = express.Router();

router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.get('/stats', getMaintenanceStats);

export default router;
