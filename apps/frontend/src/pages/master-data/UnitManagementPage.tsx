import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { Unit, getUnits, createUnit, updateUnit, deleteUnit } from '../../services/unitService';

export default function UnitManagementPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [search, setSearch] = useState('');

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Unit>();

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setIsLoading(true);
        try {
            const data = await getUnits();
            setUnits(data);
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: Unit) => {
        try {
            if (editingUnit && editingUnit._id) {
                await updateUnit(editingUnit._id, data);
                Swal.fire('Success', 'Unit updated successfully', 'success');
            } else {
                await createUnit(data);
                Swal.fire('Success', 'Unit created successfully', 'success');
            }
            closeModal();
            fetchUnits();
        } catch (error: any) {
            console.error('Error saving unit:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to save unit', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteUnit(id);
                fetchUnits();
                Swal.fire('Deleted!', 'Unit has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting unit:', error);
                Swal.fire('Error!', 'Failed to delete unit.', 'error');
            }
        }
    };

    const openModal = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit);
            setValue('name', unit.name);
            setValue('symbol', unit.symbol);
            setValue('description', unit.description);
            setValue('status', unit.status);
        } else {
            setEditingUnit(null);
            reset({ status: 'Active' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
        reset();
    };

    const filteredUnits = units.filter(unit =>
        unit.name.toLowerCase().includes(search.toLowerCase()) ||
        unit.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Unit Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage measurement units for supplies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Search units..."
                            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-primary focus:border-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Unit
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Symbol</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center">Loading...</td>
                            </tr>
                        ) : filteredUnits.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No units found.</td>
                            </tr>
                        ) : (
                            filteredUnits.map((unit) => (
                                <tr key={unit._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{unit.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded w-fit">{unit.symbol}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{unit.description || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${unit.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {unit.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(unit)}
                                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(unit._id!)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
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

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-slate-900 dark:text-white mb-4"
                                    >
                                        {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                            <input
                                                type="text"
                                                {...register('name', { required: 'Name is required' })}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                                                placeholder="e.g. Pieces"
                                            />
                                            {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Symbol</label>
                                            <input
                                                type="text"
                                                {...register('symbol', { required: 'Symbol is required' })}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                                                placeholder="e.g. Pcs"
                                            />
                                            {errors.symbol && <span className="text-xs text-red-500 mt-1">{errors.symbol.message}</span>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                            <textarea
                                                {...register('description')}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                            <select
                                                {...register('status')}
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                onClick={closeModal}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Save
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
