import { AuditLog } from '../models/auditLog.model.js';

interface AuditLogOptions {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    details?: string;
    ipAddress?: string;
    branchId?: string;
    departmentId?: string;
}

/**
 * Standardizes audit logging across the application
 */
export const recordAuditLog = async (options: AuditLogOptions) => {
    try {
        const log = new AuditLog({
            userId: options.userId,
            action: options.action,
            resourceType: options.resourceType,
            resourceId: options.resourceId,
            resourceName: options.resourceName,
            details: options.details,
            ipAddress: options.ipAddress,
            branchId: options.branchId,
            departmentId: options.departmentId
        });
        await log.save();
        return log;
    } catch (error) {
        console.error('Audit Log recording failed:', error);
        // We don't throw here to avoid breaking the main request flow
        // but in production we might want more robust handling
    }
};
