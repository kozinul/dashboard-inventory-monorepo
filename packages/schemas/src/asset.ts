import { z } from 'zod';

export const AssetStatusSchema = z.enum([
    'active',
    'maintenance',
    'storage',
    'retired',
    'assigned',
    'request maintenance',
    'disposed',
    'in_use',
    'rented',
    'event'
]);

export type AssetStatus = z.infer<typeof AssetStatusSchema>;
