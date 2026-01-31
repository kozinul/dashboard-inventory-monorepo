import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roleService, Role, Permission } from '@/services/roleService';
import Swal from 'sweetalert2';

const RESOURCES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'incoming', label: 'Incoming' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'services', label: 'Services' },
    { id: 'history', label: 'History' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
    { id: 'users', label: 'User Management' },
    { id: 'roles', label: 'Role Management' },
    { id: 'master_data', label: 'Master Data (General)' }
];

export default function RoleEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        permissions: [] as Permission[]
    });

    useEffect(() => {
        if (isEditMode && id) {
            fetchRole(id);
        } else {
            // Initialize empty permissions
            setFormData(prev => ({
                ...prev,
                permissions: RESOURCES.map(r => ({
                    resource: r.id,
                    actions: { view: false, create: false, edit: false, delete: false }
                }))
            }));
        }
    }, [id, isEditMode]);

    const fetchRole = async (roleId: string) => {
        try {
            const role = await roleService.getRoleById(roleId);

            // Merge existing permissions with all available resources to ensure the matrix is complete
            const mergedPermissions = RESOURCES.map(r => {
                const existing = role.permissions.find(p => p.resource === r.id);
                return existing || {
                    resource: r.id,
                    actions: { view: false, create: false, edit: false, delete: false }
                };
            });

            setFormData({
                name: role.name,
                slug: role.slug,
                description: role.description || '',
                permissions: mergedPermissions
            });
        } catch (error) {
            console.error('Failed to fetch role', error);
            Swal.fire('Error', 'Failed to fetch role details', 'error');
            navigate('/master-data/roles');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermissionChange = (resourceId: string, action: keyof Permission['actions'], value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => {
                if (p.resource === resourceId) {
                    return {
                        ...p,
                        actions: { ...p.actions, [action]: value }
                    };
                }
                return p;
            })
        }));
    };

    const handleSelectAllRow = (resourceId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => {
                if (p.resource === resourceId) {
                    return {
                        ...p,
                        actions: { view: checked, create: checked, edit: checked, delete: checked }
                    };
                }
                return p;
            })
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditMode && id) {
                await roleService.updateRole(id, formData);
                Swal.fire('Success', 'Role updated successfully', 'success');
            } else {
                await roleService.createRole(formData);
                Swal.fire('Success', 'Role created successfully', 'success');
            }
            navigate('/master-data/roles');
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to save role', 'error');
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/master-data/roles')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isEditMode ? 'Edit Role' : 'Create New Role'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2 border-slate-100 dark:border-slate-800">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role Name</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (Unique ID)</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 font-mono text-sm"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                required
                                disabled={isEditMode} // Prevent changing slug on edit
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-bold">Permissions</h2>
                        <p className="text-sm text-slate-500">Configure access levels for each module</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 w-1/3">Module</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 text-center w-24">Select All</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 text-center w-24">View</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 text-center w-24">Create</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 text-center w-24">Edit</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500 text-center w-24">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {formData.permissions.map((perm) => {
                                    const resourceLabel = RESOURCES.find(r => r.id === perm.resource)?.label || perm.resource;
                                    const allChecked = perm.actions.view && perm.actions.create && perm.actions.edit && perm.actions.delete;

                                    return (
                                        <tr key={perm.resource} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                                                {resourceLabel}
                                            </td>
                                            <td className="px-6 py-4 text-center border-r border-slate-100 dark:border-slate-800">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={allChecked}
                                                    onChange={(e) => handleSelectAllRow(perm.resource, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={perm.actions.view}
                                                    onChange={(e) => handlePermissionChange(perm.resource, 'view', e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={perm.actions.create}
                                                    onChange={(e) => handlePermissionChange(perm.resource, 'create', e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={perm.actions.edit}
                                                    onChange={(e) => handlePermissionChange(perm.resource, 'edit', e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    checked={perm.actions.delete}
                                                    onChange={(e) => handlePermissionChange(perm.resource, 'delete', e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/master-data/roles')}
                        className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors"
                    >
                        Save Role
                    </button>
                </div>
            </form>
        </div>
    );
}
