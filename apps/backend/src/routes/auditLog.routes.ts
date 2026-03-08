import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getAuditLogs, exportAuditLogs, clearAuditLogs } from '../controllers/auditLog.controller.js';

const router = express.Router();

router.use(protect);

// Only admins and superusers should see global audit logs
router.get('/', authorize('admin', 'superuser', 'system_admin'), getAuditLogs);
router.get('/export', authorize('admin', 'superuser', 'system_admin'), exportAuditLogs);
router.delete('/', authorize('superuser', 'system_admin'), clearAuditLogs);

export default router;
