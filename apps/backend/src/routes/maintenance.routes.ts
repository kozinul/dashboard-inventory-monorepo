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
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// === SPECIFIC NAMED ROUTES FIRST (before /:id catch-all) ===

// Stats and navigation counts
router.get('/stats', getMaintenanceStats);
router.get('/nav-counts', getNavCounts);

// User ticket routes
router.get('/my-tickets', getMyTickets);
router.get('/assigned', getAssignedTickets);
router.get('/department', authorize('superuser', 'system_admin', 'admin', 'manager', 'dept_admin', 'supervisor', 'technician', 'user'), getDepartmentTickets);

// Create routes
router.post('/', createMaintenanceRecord);
router.post('/ticket', upload.array('images'), createMaintenanceTicket);

// Ticket by ID (specific path prefix)
router.get('/ticket/:id', getMaintenanceTicket);

// === PARAMETERIZED ROUTES (/:id) ===

// Ticket actions
router.put('/:id/cancel', cancelTicket);
router.put('/:id/send', sendTicket);
router.put('/:id/accept', acceptTicket);
router.put('/:id/start', startTicket);
router.put('/:id/work', upload.fields([{ name: 'beforePhotos', maxCount: 10 }, { name: 'afterPhotos', maxCount: 10 }]), updateTicketWork);
router.put('/:id/escalate', escalateTicket);
router.put('/:id/status', updateTicketStatus);
router.put('/:id/reject', rejectTicket);
router.put('/:id/complete', completeTicket);
router.delete('/:id/supplies/:supplyItemId', removeSupplyFromTicket);

// Notes
router.post('/:id/notes', addMaintenanceNote);
router.put('/:id/notes/:noteId', updateMaintenanceNote);
router.delete('/:id/notes/:noteId', deleteMaintenanceNote);

// Generic CRUD (/:id LAST)
router.get('/', getMaintenanceRecords);
router.put('/:id', updateMaintenanceRecord);
router.delete('/:id', deleteMaintenanceRecord);
router.get('/:id', getMaintenanceTicket);

export default router;
