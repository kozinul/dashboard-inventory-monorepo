import { useState, Fragment } from "react";
import Swal from 'sweetalert2';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useRoleStore, Role } from '@/store/roleStore';

// Permission resources list
const RESOURCES = [
    { id: 'dashboard', label: 'Dashboard', actions: ['view'] },
    { id: 'inventory', label: 'Master Barang', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'incoming', label: 'Barang Masuk', actions: ['view', 'create'] },
    { id: 'transfer', label: 'Transfer', actions: ['view', 'create'] },
    { id: 'maintenance', label: 'Maintenance', actions: ['view', 'create', 'edit'] },
    { id: 'services', label: 'Services', actions: ['view', 'create', 'edit'] },
    { id: 'history', label: 'History', actions: ['view'] },
    { id: 'asset_templates', label: 'Asset Templates', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'categories', label: 'Categories', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'locations', label: 'Locations', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'vendors', label: 'Vendors', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'reports', label: 'Laporan', actions: ['view'] },
    { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
    { id: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
];

interface Permission {
    resource: string;
    actions: { view: boolean; create: boolean; edit: boolean; delete: boolean };
}

export function RoleManager() {
    const { roles, addRole, updateRole, deleteRole, cloneRole } = useRoleStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        color: '#3b82f6',
        description: '',
        permissions: [] as Permission[]
    });

    const initializePermissions = (): Permission[] => {
        return RESOURCES.map(r => ({
            resource: r.id,
            actions: { view: false, create: false, edit: false, delete: false }
        }));
    };

    const handleOpenModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                slug: role.slug,
                color: role.color,
                description: role.description,
                permissions: role.permissions.length > 0 ? role.permissions : initializePermissions()
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                slug: '',
                color: '#3b82f6',
                description: '',
                permissions: initializePermissions()
            });
        }
        setIsModalOpen(true);
    };

    const handleToggleAction = (resourceId: string, action: keyof Permission['actions']) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p => {
                if (p.resource === resourceId) {
                    return { ...p, actions: { ...p.actions, [action]: !p.actions[action] } };
                }
                return p;
            })
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRole) {
            updateRole(editingRole.id, {
                name: formData.name,
                slug: formData.slug,
                color: formData.color,
                description: formData.description,
                permissions: formData.permissions
            });
            Swal.fire('Updated!', 'Role has been updated.', 'success');
        } else {
            addRole({
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '_'),
                color: formData.color,
                description: formData.description,
                isSystem: false,
                usersCount: 0,
                permissions: formData.permissions
            });
            Swal.fire('Created!', 'Role has been created.', 'success');
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (role: Role) => {
        if (role.isSystem) {
            Swal.fire('Cannot Delete', 'System roles cannot be deleted.', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Delete role "${role.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            deleteRole(role.id);
            Swal.fire('Deleted!', 'Role has been deleted.', 'success');
        }
    };

    const handleClone = (role: Role) => {
        cloneRole(role.id);
        Swal.fire('Cloned!', `Role "${role.name}" has been cloned.`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Roles List</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    Add Role
                </button>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Users</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {roles.map(role => (
                            <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: role.color }}
                                        />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{role.name}</p>
                                            <p className="text-xs text-slate-500">{role.slug}</p>
                                        </div>
                                        {role.isSystem && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
                                                System
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                    {role.description}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                        {role.usersCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleClone(role)}
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                            title="Clone Role"
                                        >
                                            <DocumentDuplicateIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role)}
                                            className={`p-1.5 transition-colors ${role.isSystem
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-400 hover:text-red-600'}`}
                                            title={role.isSystem ? 'System role cannot be deleted' : 'Delete'}
                                            disabled={role.isSystem}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <Transition.Root show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setIsModalOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                    <div className="px-4 pb-4 pt-5 sm:p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {editingRole ? 'Edit Role' : 'Add New Role'}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-md text-gray-400 hover:text-gray-500"
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            className="h-9 w-14 rounded border border-gray-300 dark:border-slate-600"
                                                            value={formData.color}
                                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="flex-1 rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                            value={formData.color}
                                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white p-2 border"
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>

                                            {/* Permission Matrix */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions</label>
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                                            <tr>
                                                                <th className="text-left px-3 py-2 text-xs font-bold uppercase text-slate-500">Resource</th>
                                                                <th className="text-center px-2 py-2 text-xs font-bold uppercase text-slate-500 w-16">View</th>
                                                                <th className="text-center px-2 py-2 text-xs font-bold uppercase text-slate-500 w-16">Create</th>
                                                                <th className="text-center px-2 py-2 text-xs font-bold uppercase text-slate-500 w-16">Edit</th>
                                                                <th className="text-center px-2 py-2 text-xs font-bold uppercase text-slate-500 w-16">Delete</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {RESOURCES.map((resource) => {
                                                                const perm = formData.permissions.find(p => p.resource === resource.id);
                                                                return (
                                                                    <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{resource.label}</td>
                                                                        {(['view', 'create', 'edit', 'delete'] as const).map((action) => (
                                                                            <td key={action} className="text-center px-2 py-2">
                                                                                {resource.actions.includes(action) ? (
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                                                        checked={perm?.actions[action] || false}
                                                                                        onChange={() => handleToggleAction(resource.id, action)}
                                                                                    />
                                                                                ) : (
                                                                                    <span className="text-slate-300">—</span>
                                                                                )}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
                                                    onClick={() => setIsModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                                >
                                                    {editingRole ? 'Save Changes' : 'Create Role'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
