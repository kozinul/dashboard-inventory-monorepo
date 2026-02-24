import { RolePermission } from '../models/rolePermission.model.js';

/**
 * Defines what each role can access by default
 */

export interface Permission {
    resource: string;
    actions: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

// All available resources in the system
export const RESOURCES = [
    // Dashboard & Reports
    'dashboard',
    'reports',

    // Inventory Management
    'inventory',
    'panels',
    'incoming',
    'transfer',
    'disposal',
    'assignments',

    // Maintenance Management
    'maintenance',
    'my_tickets',
    'dept_tickets',
    'assigned_tickets',
    'services',

    // Rental & Events
    'rental',
    'events',

    // User Resources
    'my_assets',
    'users',
    'settings',

    // Master Data / Configuration
    'categories',
    'locations',
    'vendors',
    'asset_templates',
    'history'
] as const;

export type ResourceType = typeof RESOURCES[number];

// Helper to create permission object
const perm = (view = false, create = false, edit = false, del = false): Permission['actions'] => ({
    view, create, edit, delete: del
});

// Full access helper
const fullAccess = (): Permission['actions'] => perm(true, true, true, true);
const viewOnly = (): Permission['actions'] => perm(true, false, false, false);
const viewCreate = (): Permission['actions'] => perm(true, true, false, false);
const viewCreateEdit = (): Permission['actions'] => perm(true, true, true, false);

/**
 * Default permissions for each role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
    superuser: RESOURCES.map(resource => ({
        resource,
        actions: fullAccess()
    })),

    admin: RESOURCES.map(resource => ({
        resource,
        actions: fullAccess()
    })),

    system_admin: RESOURCES.map(resource => ({
        resource,
        actions: fullAccess()
    })),

    manager: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewCreateEdit() },
        { resource: 'panels', actions: viewCreateEdit() },
        { resource: 'incoming', actions: viewCreate() },
        { resource: 'transfer', actions: viewCreate() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'my_tickets', actions: viewCreateEdit() },
        { resource: 'dept_tickets', actions: viewCreateEdit() },
        { resource: 'services', actions: viewCreateEdit() },
        { resource: 'assignments', actions: viewCreateEdit() },
        { resource: 'rental', actions: viewCreateEdit() },
        { resource: 'events', actions: viewCreateEdit() },
        { resource: 'users', actions: viewCreateEdit() },
        { resource: 'settings', actions: viewOnly() },
        { resource: 'my_assets', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
        { resource: 'disposal', actions: viewOnly() },
    ],

    dept_admin: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewCreateEdit() },
        { resource: 'panels', actions: viewCreateEdit() },
        { resource: 'incoming', actions: viewCreate() },
        { resource: 'transfer', actions: viewCreate() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'my_tickets', actions: viewCreateEdit() },
        { resource: 'dept_tickets', actions: viewCreateEdit() },
        { resource: 'services', actions: viewCreateEdit() },
        { resource: 'assignments', actions: viewCreateEdit() },
        { resource: 'rental', actions: viewCreateEdit() },
        { resource: 'events', actions: viewCreateEdit() },
        { resource: 'users', actions: viewCreateEdit() },
        { resource: 'settings', actions: viewOnly() },
        { resource: 'my_assets', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
        { resource: 'disposal', actions: viewOnly() },
    ],

    supervisor: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewOnly() },
        { resource: 'panels', actions: viewOnly() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'my_tickets', actions: viewCreateEdit() },
        { resource: 'dept_tickets', actions: viewCreateEdit() },
        { resource: 'my_assets', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'assignments', actions: viewCreateEdit() },
        { resource: 'users', actions: viewOnly() },
    ],

    user: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewOnly() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'my_tickets', actions: viewCreateEdit() },
        { resource: 'my_assets', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
    ],

    technician: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewCreateEdit() },
        { resource: 'panels', actions: viewCreateEdit() },
        { resource: 'transfer', actions: viewCreate() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'my_tickets', actions: viewCreateEdit() },
        { resource: 'assigned_tickets', actions: viewCreateEdit() },
        { resource: 'dept_tickets', actions: viewOnly() },
        { resource: 'my_assets', actions: viewOnly() },
        { resource: 'rental', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
        { resource: 'disposal', actions: viewOnly() },
        { resource: 'assignments', actions: viewCreateEdit() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'users', actions: viewOnly() },
    ],

    auditor: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
    ]
};

/**
 * Get merged permissions for a user
 * Custom permissions override default role permissions
 */
export function getMergedPermissions(
    role: string,
    customPermissions?: Permission[]
): Permission[] {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];

    if (!customPermissions || customPermissions.length === 0) {
        return defaultPerms;
    }

    // Start with default permissions
    const mergedMap = new Map<string, Permission>();

    for (const perm of defaultPerms) {
        mergedMap.set(perm.resource, perm);
    }

    // Override with custom permissions
    for (const customPerm of customPermissions) {
        mergedMap.set(customPerm.resource, customPerm);
    }

    return Array.from(mergedMap.values());
}

/**
 * Get merged permissions for a role, checking DB for overrides
 */
export async function getMergedPermissionsFromDb(
    role: string,
    customUserPermissions?: Permission[]
): Promise<Permission[]> {
    // 1. Get default permissions for the role
    let basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

    // 2. Check if there are role-level overrides in the DB
    try {
        const roleOverride = await RolePermission.findOne({ roleSlug: role });
        if (roleOverride && roleOverride.permissions && roleOverride.permissions.length > 0) {
            basePermissions = roleOverride.toObject().permissions as unknown as Permission[];
        }
    } catch (error) {
        console.error(`Error fetching role permissions for ${role}:`, error);
        // Fall back to hardcoded defaults on error
    }

    // 3. Apply user-level custom overrides if any
    if (!customUserPermissions || customUserPermissions.length === 0) {
        return basePermissions;
    }

    const mergedMap = new Map<string, Permission>();

    // Start with role permissions (defaults or DB overrides)
    for (const perm of basePermissions) {
        mergedMap.set(perm.resource, perm);
    }

    // Override with user-specific permissions
    for (const customPerm of customUserPermissions) {
        mergedMap.set(customPerm.resource, customPerm);
    }

    return Array.from(mergedMap.values());
}

/**
 * Check if user has permission for a specific action on a resource
 */
export function hasPermission(
    permissions: Permission[],
    resource: string,
    action: keyof Permission['actions'] = 'view'
): boolean {
    const perm = permissions.find(p => p.resource === resource);
    return perm?.actions[action] === true;
}
