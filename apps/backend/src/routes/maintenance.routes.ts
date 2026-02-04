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
    getNavCounts,
    escalateTicket,
    updateTicketStatus,
    removeSupplyFromTicket,
    addMaintenanceNote,
    deleteMaintenanceNote,
    updateMaintenanceNote
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
router.get('/department', getDepartmentTickets);

router.put('/:id/accept', acceptTicket);
router.put('/:id/start', startTicket);
router.put('/:id/work', upload.fields([{ name: 'beforePhotos' }, { name: 'afterPhotos' }]), updateTicketWork);
router.put('/:id/escalate', escalateTicket);
router.put('/:id/status', updateTicketStatus);
router.put('/:id/reject', rejectTicket);
router.put('/:id/complete', completeTicket);
router.delete('/:id/supplies/:supplyItemId', protect, removeSupplyFromTicket);

router.post('/:id/notes', protect, addMaintenanceNote);
router.put('/:id/notes/:noteId', protect, updateMaintenanceNote);
router.delete('/:id/notes/:noteId', protect, deleteMaintenanceNote);

// Admin/General routes
router.get('/', getMaintenanceRecords);
router.post('/', createMaintenanceRecord);
router.put('/:id', updateMaintenanceRecord);
router.get('/stats', getMaintenanceStats);
router.get('/nav-counts', getNavCounts);
router.delete('/:id', deleteMaintenanceRecord);
router.get('/:id', getMaintenanceTicket);

export default router;
