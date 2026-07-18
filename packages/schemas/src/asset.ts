import { z } from 'zod';

export const AssetStatusSchema = z.enum([
    'active',
    'maintenance',
    'storage',
    'retired',
    'assigned',
    'request maintenance',
    'pending_delete',
    'disposed',
    'in_use',
    'rented',
    'event',
    'broken'
]);

export type AssetStatus = z.infer<typeof AssetStatusSchema>;
