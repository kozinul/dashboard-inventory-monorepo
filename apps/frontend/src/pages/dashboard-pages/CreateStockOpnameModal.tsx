import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { createStockOpname } from '@/features/inventory/api/stockOpname.api';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import axios from '@/lib/axios';
import { showSuccess, showError, showLoading, closeAlert } from '@/utils/swal';

interface CreateStockOpnameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const SO_TYPES = [
    { value: 'SUPPLY', label: 'Supply Only' },
    { value: 'ASSET', label: 'Asset Only' },
    { value: 'BOTH', label: 'Both Supply & Asset' },
];

export function CreateStockOpnameModal({ isOpen, onClose, onCreated }: CreateStockOpnameModalProps) {
    const { user } = useAuthStore();
    const { activeBranchId, branches } = useAppStore();
    const [title, setTitle] = useState('');
    const [selectedType, setSelectedType] = useState<{ value: string; label: string }>(SO_TYPES[0]!);
    const [departments, setDepartments] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSelectedType(SO_TYPES[0]!);
            setSelectedDepartment('');
            setSelectedLocation('');
            setNotes('');

            const fetchData = async () => {
                try {
                    const [deptRes, locRes] = await Promise.all([
                        axios.get('/departments'),
                        axios.get('/locations'),
                    ]);
                    setDepartments(deptRes.data);
                    setLocations(locRes.data);
                } catch (err) {
                    console.error('Failed to fetch form data', err);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const isSuperuser = user?.role === 'superuser';
    const selectedBranch = branches.find(b => b._id === activeBranchId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            showError('Validation Error', 'Title is required');
            return;
        }

        setIsSubmitting(true);
        showLoading('Creating Stock Opname', 'Please wait...');

        try {
            await createStockOpname({
                title: title.trim(),
                type: selectedType?.value || 'SUPPLY',
                departmentId: selectedDepartment || undefined,
                locationId: selectedLocation || undefined,
                notes: notes.trim() || undefined,
                ...(isSuperuser && activeBranchId !== 'ALL' ? { branchId: activeBranchId } : {}),
            });

            closeAlert();
            showSuccess('Stock Opname Created', `${title.trim()} has been created successfully.`);
            onCreated();
            onClose();
        } catch (err: any) {
            closeAlert();
            showError('Failed to Create', err.response?.data?.message || 'Something went wrong while creating the Stock Opname.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-primary">fact_check</span>
                                    New Stock Opname
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                            placeholder="e.g. Q4 2025 Inventory Audit"
                                            required
                                        />
                                    </div>

                                    {isSuperuser && selectedBranch && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                                            <input
                                                type="text"
                                                value={selectedBranch.name}
                                                disabled
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-sm cursor-not-allowed"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scope Type</label>
                                        <Listbox value={selectedType} onChange={(v) => v && setSelectedType(v)}>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-full cursor-default rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-3 pr-10 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                                    <span className="block truncate">{selectedType?.label || 'Supply Only'}</span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </span>
                                                </Listbox.Button>
                                                <Transition
                                                    as={Fragment}
                                                    leave="transition ease-in duration-100"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                                                        {SO_TYPES.map((soType) => (
                                                            <Listbox.Option
                                                                key={soType.value}
                                                                className={({ active }) =>
                                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-white'}`
                                                                }
                                                                value={soType}
                                                            >
                                                                {({ selected }) => (
                                                                    <>
                                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                            {soType.label}
                                                                        </span>
                                                                        {selected ? (
                                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                            </span>
                                                                        ) : null}
                                                                    </>
                                                                )}
                                                            </Listbox.Option>
                                                        ))}
                                                    </Listbox.Options>
                                                </Transition>
                                            </div>
                                        </Listbox>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department (optional)</label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={e => setSelectedDepartment(e.target.value)}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">All Departments</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location (optional)</label>
                                        <select
                                            value={selectedLocation}
                                            onChange={e => setSelectedLocation(e.target.value)}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">All Locations</option>
                                            {locations.map(loc => (
                                                <option key={loc._id} value={loc._id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                            placeholder="Any additional notes..."
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
