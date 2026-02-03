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
    sendTicket,
    updateTicketWork,
    getMaintenanceTicket,
    getNavCounts
} from '../controllers/maintenance.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User ticket routes
router.get('/ticket/:id', getMaintenanceTicket);
router.get('/my-tickets', getMyTickets);
router.post('/ticket', upload.array('images'), createMaintenanceTicket);
router.put('/:id/cancel', cancelTicket);
router.put('/:id/send', sendTicket);

// Technician routes
router.get('/assigned', getAssignedTickets);
router.put('/:id/start', startTicket);
router.put('/:id/work', updateTicketWork);


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
router.get('/nav-counts', getNavCounts);
router.delete('/:id', deleteMaintenanceRecord);
router.get('/:id', getMaintenanceTicket);

export default router;
