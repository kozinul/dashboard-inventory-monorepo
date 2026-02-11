import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { branchService, Branch } from '../../services/branchService';
import { showSuccessToast, showErrorToast, showConfirmDelete } from '../../utils/swal';
import { clsx } from 'clsx';

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isdataModalOpen, setIsDataModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<Branch>>();

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const data = await branchService.getAll();
            setBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches", error);
            showErrorToast('Failed to load branches.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreate = () => {
        setEditingBranch(null);
        reset({ name: '', code: '', address: '', isHeadOffice: false, status: 'Active' });
        setIsDataModalOpen(true);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        reset(branch);
        setIsDataModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirmDelete('Delete Branch', 'Are you sure you want to delete this branch?');
        if (confirmed) {
            try {
                await branchService.delete(id);
                showSuccessToast('Branch deleted successfully');
                fetchBranches();
            } catch (error) {
                showErrorToast('Failed to delete branch');
            }
        }
    };

    const onSubmit = async (data: Partial<Branch>) => {
        try {
            if (editingBranch) {
                await branchService.update(editingBranch._id, data);
                showSuccessToast('Branch updated successfully');
            } else {
                await branchService.create(data);
                showSuccessToast('Branch created successfully');
            }
            setIsDataModalOpen(false);
            fetchBranches();
        } catch (error) {
            console.error(error);
            showErrorToast('Failed to save branch');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Branch Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage organization sites and locations</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Branch
                </button>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : branches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No branches found.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900 dark:text-white">{branch.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{branch.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {branch.isHeadOffice ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                                                    <span className="material-symbols-outlined text-[14px]">domain</span>
                                                    Head Office
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                                    <span className="material-symbols-outlined text-[14px]">store</span>
                                                    Site / Branch
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {branch.address || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 text-xs font-medium rounded-full",
                                                branch.status === 'Active'
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                {branch.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(branch._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            <Transition appear show={isdataModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsDataModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark p-6 transition-all shadow-xl border border-slate-200 dark:border-border-dark">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                                        {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Branch Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                {...register('name', { required: 'Name is required' })}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                                placeholder="e.g. Grand Hotel"
                                            />
                                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Code <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    {...register('code', { required: 'Code is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm uppercase"
                                                    placeholder="e.g. HTL"
                                                />
                                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Status
                                                </label>
                                                <select
                                                    {...register('status')}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Address
                                            </label>
                                            <textarea
                                                {...register('address')}
                                                rows={3}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                                placeholder="Enter full address..."
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="isHeadOffice"
                                                {...register('isHeadOffice')}
                                                className="rounded border-slate-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="isHeadOffice" className="text-sm text-slate-700 dark:text-slate-300 select-none">
                                                This is the Head Office
                                            </label>
                                        </div>

                                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setIsDataModalOpen(false)}
                                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            >
                                                {editingBranch ? 'Save Changes' : 'Create Branch'}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
