/**
 * Default Role Permissions Configuration
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
    'dashboard',
    'inventory',
    'incoming',
    'transfer',
    'maintenance',
    'services',
    'history',
    'asset_templates',
    'categories',
    'locations',
    'vendors',
    'reports',
    'settings',
    'users'
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

    manager: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewCreateEdit() },
        { resource: 'incoming', actions: viewCreate() },
        { resource: 'transfer', actions: viewCreate() },
        { resource: 'maintenance', actions: viewCreateEdit() },
        { resource: 'services', actions: viewCreateEdit() },
        { resource: 'history', actions: viewOnly() },
        { resource: 'reports', actions: viewOnly() },
    ],

    user: [
        { resource: 'dashboard', actions: viewOnly() },
        { resource: 'inventory', actions: viewOnly() },
        { resource: 'history', actions: viewOnly() },
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
