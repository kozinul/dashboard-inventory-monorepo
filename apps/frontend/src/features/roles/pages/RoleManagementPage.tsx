import { useState, useEffect } from 'react';
import { roleService, Role } from '@/services/roleService';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

export default function RoleManagementPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            Swal.fire('Error', 'Failed to load roles', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Role?',
            text: "This action cannot be undone. Users with this role might lose access.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                await roleService.deleteRole(id);
                Swal.fire('Deleted!', 'Role has been deleted.', 'success');
                fetchRoles();
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete role', 'error');
            }
        }
    };

    if (isLoading) return <div className="p-8">Loading roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Role Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user roles and permissions</p>
                </div>
                <Link
                    to="/master-data/roles/create"
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Create New Role
                </Link>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Role Name</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Description</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center">System Role</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {roles.map((role) => (
                            <tr key={role._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 dark:text-white">{role.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{role.slug}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {role.description || '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {role.isSystem ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                            System
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                            Custom
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            to={`/master-data/roles/${role._id}/edit`}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Edit Permissions"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                        </Link>
                                        {!role.isSystem && (
                                            <button
                                                onClick={() => handleDelete(role._id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Role"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No roles found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
