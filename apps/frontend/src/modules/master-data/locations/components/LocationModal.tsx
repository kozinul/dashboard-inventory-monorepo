import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BoxLocation, CreateLocationDto } from '@/services/locationService';
import { locationTypeService } from '@/services/locationTypeService';
import { departmentService, Department } from '@/services/departmentService';
import { useAuthStore } from '@/store/authStore';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateLocationDto) => Promise<void>;
    editingLocation?: BoxLocation | null;
    parentLocation?: BoxLocation | null;
}



export function LocationModal({ isOpen, onClose, onSubmit, editingLocation, parentLocation }: LocationModalProps) {
    const [formData, setFormData] = useState<CreateLocationDto>({
        name: '',
        type: 'Building',
        description: '',
        status: 'Active',
        parentId: null,
        departmentId: '',
        isWarehouse: false,
        capacity: 0
    });

    const [locationTypes, setLocationTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const { user } = useAuthStore();
    const canManageWarehouse = user?.role === 'superuser' || user?.role === 'admin';

    useEffect(() => {
        const fetchTypes = async () => {
            if (!isOpen) return;
            setLoadingTypes(true);
            try {
                const types = await locationTypeService.getAll();
                setLocationTypes(types.map(t => t.name));

                if (canManageWarehouse) {
                    const depts = await departmentService.getAll();
                    setDepartments(depts);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoadingTypes(false);
            }
        };

        fetchTypes();
    }, [isOpen, canManageWarehouse]);

    useEffect(() => {
        if (isOpen) {
            if (editingLocation) {
                setFormData({
                    name: editingLocation.name,
                    type: editingLocation.type,
                    description: editingLocation.description || '',
                    status: editingLocation.status,
                    parentId: editingLocation.parentId,
                    departmentId: editingLocation.departmentId?._id || editingLocation.departmentId || '',
                    isWarehouse: editingLocation.isWarehouse || false,
                    capacity: (editingLocation as any).capacity || 0
                });
            } else {
                // Auto-select type based on parent
                let defaultType = locationTypes.length > 0 ? locationTypes[0] : 'Building';
                if (parentLocation?.type === 'Room') {
                    defaultType = 'Rack'; // or Panel
                } else if (parentLocation?.type === 'Building') {
                    defaultType = 'Floor';
                } else if (parentLocation?.type === 'Floor') {
                    defaultType = 'Room';
                }

                setFormData({
                    name: '',
                    type: defaultType || '',
                    description: '',
                    status: 'Active',
                    parentId: parentLocation ? parentLocation._id : null,
                    departmentId: '',
                    isWarehouse: false,
                    capacity: 0
                });
            }
        }
    }, [isOpen, editingLocation, parentLocation, locationTypes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-surface-dark border border-border-dark px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-surface-dark text-text-secondary hover:text-white focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div>
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-white">
                                            {editingLocation ? 'Edit Location' : 'Add Location'}
                                        </Dialog.Title>
                                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium leading-6 text-text-secondary">
                                                    Parent Location
                                                </label>
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        disabled
                                                        className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6 disabled:opacity-50"
                                                        value={parentLocation ? parentLocation.name : 'Root (Top Level)'}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium leading-6 text-white">
                                                    Location Name
                                                </label>
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        id="name"
                                                        required
                                                        className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium leading-6 text-white">
                                                    Type
                                                </label>
                                                <div className="mt-2">
                                                    <select
                                                        id="type"
                                                        name="type"
                                                        className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                        value={formData.type}
                                                        onChange={(e) => {
                                                            const newType = e.target.value;
                                                            setFormData({
                                                                ...formData,
                                                                type: newType,
                                                                isWarehouse: newType === 'Warehouse' ? true : formData.isWarehouse
                                                            });
                                                        }}
                                                        disabled={loadingTypes}
                                                    >
                                                        {loadingTypes ? (
                                                            <option>Loading types...</option>
                                                        ) : (
                                                            locationTypes.map((type) => (
                                                                <option key={type} value={type}>{type}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            {(formData.type === 'Rack' || formData.type === 'Panel' || formData.type === 'Panel Box') && (
                                                <div>
                                                    <label htmlFor="capacity" className="block text-sm font-medium leading-6 text-white">
                                                        Capacity (Total Slots)
                                                    </label>
                                                    <div className="mt-2">
                                                        <input
                                                            type="number"
                                                            name="capacity"
                                                            id="capacity"
                                                            min="0"
                                                            className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                            value={formData.capacity}
                                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label htmlFor="description" className="block text-sm font-medium leading-6 text-white">
                                                    Description
                                                </label>
                                                <div className="mt-2">
                                                    <textarea
                                                        id="description"
                                                        name="description"
                                                        rows={3}
                                                        className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {canManageWarehouse && (
                                                <>
                                                    <div>
                                                        <label htmlFor="departmentId" className="block text-sm font-medium leading-6 text-white">
                                                            Department (Owner)
                                                        </label>
                                                        <div className="mt-2">
                                                            <select
                                                                id="departmentId"
                                                                name="departmentId"
                                                                className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                                value={formData.departmentId || ''}
                                                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                                            >
                                                                <option value="">None (General/Shared)</option>
                                                                {departments.map((dept) => (
                                                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="relative flex items-start">
                                                        <div className="flex h-6 items-center">
                                                            <input
                                                                id="isWarehouse"
                                                                name="isWarehouse"
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-accent-indigo focus:ring-accent-indigo"
                                                                checked={formData.isWarehouse || false}
                                                                onChange={(e) => setFormData({ ...formData, isWarehouse: e.target.checked })}
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm leading-6">
                                                            <label htmlFor="isWarehouse" className="font-medium text-white">
                                                                Is Warehouse?
                                                            </label>
                                                            <p className="text-gray-400">Mark this location as the main storage warehouse for the selected department.</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                                <button
                                                    type="submit"
                                                    className="inline-flex w-full justify-center rounded-md bg-accent-indigo px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                                                >
                                                    {editingLocation ? 'Save Changes' : 'Create'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-surface-dark px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-border-dark hover:bg-white/5 sm:col-start-1 sm:mt-0"
                                                    onClick={onClose}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
