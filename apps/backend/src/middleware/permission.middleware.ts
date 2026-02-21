import { Request, Response, NextFunction } from 'express';
import { hasPermission, getMergedPermissionsFromDb, ResourceType, Permission } from '../config/rolePermissions.config.js';

/**
 * Middleware to check if a user has permission for a specific resource and action
 * @param resource The resource name (e.g., 'inventory', 'users')
 * @param action The action type ('view', 'create', 'edit', 'delete')
 */
export const checkPermission = (resource: ResourceType, action: keyof Permission['actions'] = 'view') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401);
            return next(new Error('Not authorized, no user found'));
        }

        // Superusers bypass all granular permission checks
        if (req.user.role === 'superuser') {
            return next();
        }

        // Get merged permissions based on role and custom permissions (checking DB for role overrides)
        const userPermissions = await getMergedPermissionsFromDb(
            req.user.role,
            req.user.useCustomPermissions ? req.user.customPermissions : undefined
        );

        const permitted = hasPermission(userPermissions, resource, action);

        if (!permitted) {
            res.status(403);
            return next(new Error(`Permission denied: You do not have '${action}' access to '${resource}'`));
        }

        next();
    };
};
