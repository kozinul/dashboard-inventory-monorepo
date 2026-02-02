import express from 'express';
import {
    getMaintenanceRecords,
    getMyTickets,
    getDepartmentTickets,
    createMaintenanceRecord,
    createMaintenanceTicket,
    updateMaintenanceRecord,
    getMaintenanceStats,
    deleteMaintenanceRecord,
    acceptTicket,
    startTicket,
    getAssignedTickets,
    rejectTicket,
    completeTicket,
    cancelTicket,
    sendTicket
} from '../controllers/maintenance.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User ticket routes
router.get('/my-tickets', getMyTickets);
router.post('/ticket', createMaintenanceTicket);
router.put('/:id/cancel', cancelTicket);
router.put('/:id/send', sendTicket);

// Technician routes
router.get('/assigned', getAssignedTickets);
router.put('/:id/start', startTicket);


// Manager/Department routes
router.get('/department', getDepartmentTickets);
router.put('/:id/accept', acceptTicket);
router.put('/:id/reject', rejectTicket);
router.put('/:id/complete', completeTicket);

// Admin/General routes
router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.get('/stats', getMaintenanceStats);
router.delete('/:id', deleteMaintenanceRecord);

export default router;
