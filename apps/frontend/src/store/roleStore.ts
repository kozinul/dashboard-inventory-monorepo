import { create } from 'zustand';

interface Permission {
    resource: string;
    actions: { view: boolean; create: boolean; edit: boolean; delete: boolean };
}

export interface Role {
    id: string;
    name: string;
    slug: string;
    color: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
    usersCount: number;
}

// Helper functions
const fullAccess = (): Permission['actions'] => ({ view: true, create: true, edit: true, delete: true });
const viewOnly = (): Permission['actions'] => ({ view: true, create: false, edit: false, delete: false });
const viewCreate = (): Permission['actions'] => ({ view: true, create: true, edit: false, delete: false });
const viewCreateEdit = (): Permission['actions'] => ({ view: true, create: true, edit: true, delete: false });

const RESOURCES = [
    'dashboard', 'inventory', 'incoming', 'transfer', 'maintenance', 'services',
    'history', 'asset_templates', 'categories', 'locations', 'vendors', 'reports', 'settings', 'users', 'assigned_tickets'
];

// Default Roles
const DEFAULT_ROLES: Role[] = [
    {
        id: '1', name: 'Super User', slug: 'superuser', color: '#ef4444',
        description: 'Full system access', isSystem: true, usersCount: 1,
        permissions: RESOURCES.map(r => ({ resource: r, actions: fullAccess() }))
    },
    {
        id: '2', name: 'System Admin', slug: 'system_admin', color: '#ea580c',
        description: 'Full system access (Editable)', isSystem: true, usersCount: 0,
        permissions: RESOURCES.map(r => ({ resource: r, actions: fullAccess() }))
    },
    {
        id: '3', name: 'Administrator', slug: 'admin', color: '#f97316',
        description: 'Administrative access', isSystem: true, usersCount: 3,
        permissions: RESOURCES.map(r => ({ resource: r, actions: fullAccess() }))
    },
    {
        id: '3', name: 'Manager', slug: 'manager', color: '#3b82f6',
        description: 'Managerial access', isSystem: false, usersCount: 5,
        permissions: [
            { resource: 'dashboard', actions: viewOnly() },
            { resource: 'inventory', actions: viewCreateEdit() },
            { resource: 'incoming', actions: viewCreate() },
            { resource: 'transfer', actions: viewCreate() },
            { resource: 'maintenance', actions: viewCreateEdit() },
            { resource: 'services', actions: viewCreateEdit() },
            { resource: 'history', actions: viewOnly() },
            { resource: 'reports', actions: viewOnly() },
        ]
    },
    {
        id: '4', name: 'User', slug: 'user', color: '#22c55e',
        description: 'Standard user access', isSystem: false, usersCount: 12,
        permissions: [
            { resource: 'dashboard', actions: viewOnly() },
            { resource: 'inventory', actions: viewOnly() },
            { resource: 'history', actions: viewOnly() },
            { resource: 'my_assets', actions: viewOnly() },
        ]
    },
    {
        id: '6', name: 'Technician', slug: 'technician', color: '#06b6d4',
        description: 'Maintenance technician access', isSystem: false, usersCount: 0,
        permissions: [
            { resource: 'dashboard', actions: viewOnly() },
            { resource: 'maintenance', actions: viewOnly() },
            { resource: 'assigned_tickets', actions: viewCreateEdit() }, // Custom resource
            { resource: 'my_assets', actions: viewOnly() },
        ]
    },
    {
        id: '5', name: 'Auditor', slug: 'auditor', color: '#a855f7',
        description: 'Read-only audit access', isSystem: false, usersCount: 2,
        permissions: [
            { resource: 'dashboard', actions: viewOnly() },
            { resource: 'inventory', actions: viewOnly() },
            { resource: 'history', actions: viewOnly() },
            { resource: 'reports', actions: viewOnly() },
        ]
    }
];

interface RoleState {
    roles: Role[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (id: string, data: Partial<Role>) => void;
    deleteRole: (id: string) => void;
    cloneRole: (id: string) => void;
    getRoleBySlug: (slug: string) => Role | undefined;
}

export const useRoleStore = create<RoleState>((set, get) => ({
    roles: DEFAULT_ROLES,

    addRole: (roleData) => {
        const newRole: Role = {
            ...roleData,
            id: Date.now().toString(),
        };
        set(state => ({ roles: [...state.roles, newRole] }));
    },

    updateRole: (id, data) => {
        set(state => ({
            roles: state.roles.map(r => r.id === id ? { ...r, ...data } : r)
        }));
    },

    deleteRole: (id) => {
        set(state => ({
            roles: state.roles.filter(r => r.id !== id)
        }));
    },

    cloneRole: (id) => {
        const role = get().roles.find(r => r.id === id);
        if (role) {
            const clonedRole: Role = {
                ...role,
                id: Date.now().toString(),
                name: `${role.name} (Copy)`,
                slug: `${role.slug}_copy`,
                isSystem: false,
                usersCount: 0
            };
            set(state => ({ roles: [...state.roles, clonedRole] }));
        }
    },

    getRoleBySlug: (slug) => {
        return get().roles.find(r => r.slug === slug);
    }
}));
