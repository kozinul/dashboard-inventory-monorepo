import { z } from 'zod';

export const MaintenanceStatusSchema = z.enum([
    'Draft',
    'Sent',
    'Accepted',
    'In Progress',
    'Done',
    'Rejected',
    'Cancelled',
    'On Hold',
    'External Service',
    'Pending',
    'Escalated',
    'Closed'
]);

export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>;

export const MaintenanceTypeSchema = z.enum([
    'Repair',
    'Routine',
    'Emergency',
    'Firmware',
    'Installation',
    'Inspection',
    'Maintenance'
]);

export type MaintenanceType = z.infer<typeof MaintenanceTypeSchema>;

export const ServiceProviderTypeSchema = z.enum([
    'Internal',
    'Vendor'
]);

export type ServiceProviderType = z.infer<typeof ServiceProviderTypeSchema>;
