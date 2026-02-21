import { Request, Response, NextFunction } from 'express';
import { RolePermission } from '../models/rolePermission.model.js';
import { DEFAULT_ROLE_PERMISSIONS, RESOURCES, Permission } from '../config/rolePermissions.config.js';

/**
 * @desc    Get all roles with their permissions (DB overrides merged with defaults)
 * @route   GET /api/v1/role-permissions
 * @access  Private (Admin)
 */
export const getAllRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get all DB overrides
        const dbOverrides = await RolePermission.find();
        const overrideMap = new Map(dbOverrides.map(o => [o.roleSlug, o.permissions]));

        // Build result: for each known role, use DB override if exists, else default
        const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS);
        const result = roles.map(roleSlug => {
            const dbPerms = overrideMap.get(roleSlug);
            return {
                roleSlug,
                permissions: dbPerms || DEFAULT_ROLE_PERMISSIONS[roleSlug] || [],
                isCustomized: !!dbPerms
            };
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update permissions for a specific role
 * @route   PUT /api/v1/role-permissions/:slug
 * @access  Private (Admin)
 */
export const updateRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        const { permissions } = req.body;

        if (!permissions || !Array.isArray(permissions)) {
            res.status(400);
            throw new Error('Permissions array is required');
        }

        // Validate that the role slug exists in defaults
        if (!DEFAULT_ROLE_PERMISSIONS[slug]) {
            res.status(404);
            throw new Error(`Role "${slug}" not found`);
        }

        // Upsert: create if not exists, update if exists
        const rolePermission = await RolePermission.findOneAndUpdate(
            { roleSlug: slug },
            { roleSlug: slug, permissions },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({
            roleSlug: rolePermission.roleSlug,
            permissions: rolePermission.permissions,
            isCustomized: true
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset a role's permissions back to defaults (delete DB override)
 * @route   DELETE /api/v1/role-permissions/:slug
 * @access  Private (Admin)
 */
export const resetRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        await RolePermission.findOneAndDelete({ roleSlug: slug });
        res.json({
            roleSlug: slug,
            permissions: DEFAULT_ROLE_PERMISSIONS[slug] || [],
            isCustomized: false
        });
    } catch (error) {
        next(error);
    }
};
