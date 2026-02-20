import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/auditLog.model.js';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const filters: any = {};

        // RBAC: Non-admin roles are restricted to their branch/department
        const isPowerUser = ['superuser', 'admin'].includes(req.user.role);

        if (!isPowerUser) {
            filters.branchId = req.user.branchId;
            if (req.user.departmentId) {
                filters.$or = [
                    { departmentId: req.user.departmentId },
                    { userId: req.user._id }
                ];
            } else {
                filters.userId = req.user._id;
            }
        }

        if (req.query.userId) filters.userId = req.query.userId;
        if (req.query.resourceType) filters.resourceType = req.query.resourceType;
        if (req.query.resourceId) filters.resourceId = req.query.resourceId;
        if (req.query.action) filters.action = req.query.action;

        // Date range filtering
        if (req.query.startDate || req.query.endDate) {
            filters.createdAt = {};
            if (req.query.startDate) {
                filters.createdAt.$gte = new Date(req.query.startDate as string);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate as string);
                end.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = end;
            }
        }

        const logs = await AuditLog.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name username role');

        const total = await AuditLog.countDocuments(filters);

        res.json({
            data: logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const exportAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters: any = {};

        const isPowerUser = ['superuser', 'admin'].includes(req.user.role);

        if (!isPowerUser) {
            filters.branchId = req.user.branchId;
            if (req.user.departmentId) {
                filters.$or = [
                    { departmentId: req.user.departmentId },
                    { userId: req.user._id }
                ];
            } else {
                filters.userId = req.user._id;
            }
        }

        if (req.query.userId) filters.userId = req.query.userId;
        if (req.query.resourceType) filters.resourceType = req.query.resourceType;
        if (req.query.action) filters.action = req.query.action;

        if (req.query.startDate || req.query.endDate) {
            filters.createdAt = {};
            if (req.query.startDate) {
                filters.createdAt.$gte = new Date(req.query.startDate as string);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate as string);
                end.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = end;
            }
        }

        const logs = await AuditLog.find(filters)
            .sort({ createdAt: -1 })
            .populate('userId', 'name username role');

        // Generate CSV
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Name', 'Details', 'IP Address'];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            (log.userId as any)?.name || 'System',
            log.action,
            log.resourceType,
            log.resourceName || '-',
            log.details || '-',
            log.ipAddress || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};
