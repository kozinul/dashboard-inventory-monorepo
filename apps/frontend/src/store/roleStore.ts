import { create } from 'zustand';
import axios from '../lib/axios';

interface Permission {
    resource: string;
    actions: { view: boolean; create: boolean; edit: boolean; delete: boolean };
}

export interface Role {
    id: string; // Internal frontend ID or slug
    name: string;
    slug: string;
    color: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
    usersCount: number;
    isCustomized?: boolean;
}

interface RoleState {
    roles: Role[];
    isLoading: boolean;
    error: string | null;
    fetchRoles: () => Promise<void>;
    updateRolePermissions: (slug: string, permissions: Permission[]) => Promise<void>;
    resetRolePermissions: (slug: string) => Promise<void>;
    getRoleBySlug: (slug: string) => Role | undefined;
}

// Initial/Fallback roles for UI consistency before API loads
const FALLBACK_ROLES: Role[] = [
    { id: 'superuser', name: 'Super User', slug: 'superuser', color: '#ef4444', description: 'Full system access', isSystem: true, usersCount: 1, permissions: [] },
    { id: 'system_admin', name: 'System Admin', slug: 'system_admin', color: '#ea580c', description: 'Full system access (Editable)', isSystem: true, usersCount: 0, permissions: [] },
    { id: 'admin', name: 'Administrator', slug: 'admin', color: '#f97316', description: 'Administrative access', isSystem: true, usersCount: 3, permissions: [] },
    { id: 'manager', name: 'Manager', slug: 'manager', color: '#3b82f6', description: 'Managerial access', isSystem: false, usersCount: 5, permissions: [] },
    { id: 'user', name: 'User', slug: 'user', color: '#22c55e', description: 'Standard user access', isSystem: false, usersCount: 12, permissions: [] },
    { id: 'auditor', name: 'Auditor', slug: 'auditor', color: '#a855f7', description: 'Read-only audit access', isSystem: false, usersCount: 2, permissions: [] },
    { id: 'technician', name: 'Technician', slug: 'technician', color: '#06b6d4', description: 'Maintenance technician access', isSystem: false, usersCount: 0, permissions: [] },
    { id: 'dept_admin', name: 'Department Admin', slug: 'dept_admin', color: '#8b5cf6', description: 'Department-level administration', isSystem: false, usersCount: 0, permissions: [] },
    { id: 'supervisor', name: 'Supervisor', slug: 'supervisor', color: '#db2777', description: 'Team supervisor access', isSystem: false, usersCount: 0, permissions: [] }
];

export const useRoleStore = create<RoleState>((set, get) => ({
    roles: FALLBACK_ROLES,
    isLoading: false,
    error: null,

    fetchRoles: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get('/role-permissions');
            const apiRoles = response.data;

            // Merge API data with fallback roles (to keep colors/descriptions/etc)
            const mergedRoles = FALLBACK_ROLES.map(fallback => {
                const apiRole = apiRoles.find((r: any) => r.roleSlug === fallback.slug);
                if (apiRole) {
                    return {
                        ...fallback,
                        permissions: apiRole.permissions,
                        isCustomized: apiRole.isCustomized
                    };
                }
                return fallback;
            });

            set({ roles: mergedRoles, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch roles',
                isLoading: false
            });
        }
    },

    updateRolePermissions: async (slug, permissions) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`/role-permissions/${slug}`, { permissions });
            const updatedData = response.data;

            set(state => ({
                roles: state.roles.map(r =>
                    r.slug === slug
                        ? { ...r, permissions: updatedData.permissions, isCustomized: true }
                        : r
                ),
                isLoading: false
            }));
        } catch (error: any) {
            const errMsg = error.response?.data?.message || 'Failed to update role permissions';
            set({ error: errMsg, isLoading: false });
            throw new Error(errMsg);
        }
    },

    resetRolePermissions: async (slug) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.delete(`/role-permissions/${slug}`);
            const updatedData = response.data;

            set(state => ({
                roles: state.roles.map(r =>
                    r.slug === slug
                        ? { ...r, permissions: updatedData.permissions, isCustomized: false }
                        : r
                ),
                isLoading: false
            }));
        } catch (error: any) {
            const errMsg = error.response?.data?.message || 'Failed to reset role permissions';
            set({ error: errMsg, isLoading: false });
            throw new Error(errMsg);
        }
    },

    getRoleBySlug: (slug) => {
        return get().roles.find(r => r.slug === slug);
    }
}));

