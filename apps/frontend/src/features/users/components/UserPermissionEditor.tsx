import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from '@/lib/axios';

interface Permission {
    resource: string;
    actions: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

import { useRoleStore } from '@/store/roleStore';

// All available resources — synced with backend rolePermissions.config.ts
const RESOURCES = [
    { id: 'dashboard', label: 'Dashboard', actions: ['view'] },
    { id: 'inventory', label: 'Master Barang', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'incoming', label: 'Barang Masuk', actions: ['view', 'create'] },
    { id: 'transfer', label: 'Transfer', actions: ['view', 'create'] },
    { id: 'disposal', label: 'Disposal', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'assignments', label: 'Assignments', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'maintenance', label: 'Maintenance', actions: ['view', 'create', 'edit'] },
    { id: 'my_tickets', label: 'My Tickets', actions: ['view', 'create', 'edit'] },
    { id: 'dept_tickets', label: 'Dept. Tickets', actions: ['view', 'create', 'edit'] },
    { id: 'assigned_tickets', label: 'Assigned Jobs', actions: ['view', 'create', 'edit'] },
    { id: 'services', label: 'Services', actions: ['view', 'create', 'edit'] },
    { id: 'rental', label: 'Rental', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'events', label: 'Events', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'my_assets', label: 'My Assets', actions: ['view'] },
    { id: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
    { id: 'reports', label: 'Laporan', actions: ['view'] },
    { id: 'history', label: 'History', actions: ['view'] },
    { id: 'asset_templates', label: 'Asset Templates', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'categories', label: 'Categories', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'locations', label: 'Locations', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'vendors', label: 'Vendors', actions: ['view', 'create', 'edit', 'delete'] },
];

interface UserPermissionEditorProps {
    userId: string;
    userRole: string;
}

export default function UserPermissionEditor({ userId, userRole }: UserPermissionEditorProps) {
    const [useCustomPermissions, setUseCustomPermissions] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { roles, fetchRoles } = useRoleStore();

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        if (roles.length > 0) {
            fetchUserPermissions();
        }
    }, [userId, roles]);

    const fetchUserPermissions = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/users/${userId}`);
            const user = response.data;

            setUseCustomPermissions(user.useCustomPermissions || false);

            // Initialize permissions from user data or fallback to their role's default permissions
            if (user.customPermissions && user.customPermissions.length > 0) {
                // Ensure all resources exist even if backend array was older
                const existingMap = new Map(user.customPermissions.map((p: any) => [p.resource, p]));
                setPermissions(RESOURCES.map(r => {
                    const existing = existingMap.get(r.id) as any;
                    return existing || {
                        resource: r.id,
                        actions: { view: false, create: false, edit: false, delete: false }
                    };
                }));
            } else {
                // Pre-fill with the default permissions for their current role
                const userRoleData = roles.find(r => r.slug === userRole);
                const rolePerms = userRoleData?.permissions || [];
                const rolePermsMap = new Map(rolePerms.map(p => [p.resource, p]));

                setPermissions(RESOURCES.map(r => {
                    const defaultPerm = rolePermsMap.get(r.id);
                    return {
                        resource: r.id,
                        actions: defaultPerm ? { ...defaultPerm.actions } : { view: false, create: false, edit: false, delete: false }
                    };
                }));
            }
        } catch (error) {
            console.error('Failed to fetch user permissions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAction = (resourceId: string, action: keyof Permission['actions']) => {
        setPermissions(prev => prev.map(p => {
            if (p.resource === resourceId) {
                return {
                    ...p,
                    actions: {
                        ...p.actions,
                        [action]: !p.actions[action]
                    }
                };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await axios.put(`/users/${userId}/permissions`, {
                useCustomPermissions,
                customPermissions: permissions
            });
            Swal.fire('Berhasil!', 'Permissions berhasil disimpan', 'success');
        } catch (error) {
            console.error('Failed to save permissions', error);
            Swal.fire('Error', 'Gagal menyimpan permissions', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center">Loading permissions...</div>;
    }

    // Admin and superuser always have full access
    if (userRole === 'admin' || userRole === 'superuser') {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">verified_user</span>
                    <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Full Access</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                            User dengan role "{userRole}" memiliki akses penuh ke semua fitur.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toggle Custom Permissions */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Custom Permissions</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {useCustomPermissions
                            ? 'Menggunakan custom permissions (override dari default role)'
                            : `Menggunakan default permissions dari role "${userRole}"`}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={useCustomPermissions}
                        onChange={(e) => setUseCustomPermissions(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            {/* Permission Matrix */}
            {useCustomPermissions && (
                <div className="bg-white dark:bg-card-dark rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Resource</th>
                                <th className="text-center px-2 py-3 text-xs font-bold uppercase text-slate-500 w-20">View</th>
                                <th className="text-center px-2 py-3 text-xs font-bold uppercase text-slate-500 w-20">Create</th>
                                <th className="text-center px-2 py-3 text-xs font-bold uppercase text-slate-500 w-20">Edit</th>
                                <th className="text-center px-2 py-3 text-xs font-bold uppercase text-slate-500 w-20">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {RESOURCES.map((resource) => {
                                const perm = permissions.find(p => p.resource === resource.id);
                                return (
                                    <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{resource.label}</span>
                                        </td>
                                        {(['view', 'create', 'edit', 'delete'] as const).map((action) => (
                                            <td key={action} className="text-center px-2 py-3">
                                                {resource.actions.includes(action) ? (
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
                                                        checked={perm?.actions[action] || false}
                                                        onChange={() => handleToggleAction(resource.id, action)}
                                                    />
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">save</span>
                            Simpan Permissions
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
