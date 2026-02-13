import { z } from 'zod';

export const TransferStatusSchema = z.enum([
    'Pending',
    'WaitingApproval',
    'InTransit',
    'Completed',
    'Rejected',
    'Cancelled'
]);

export type TransferStatus = z.infer<typeof TransferStatusSchema>;
