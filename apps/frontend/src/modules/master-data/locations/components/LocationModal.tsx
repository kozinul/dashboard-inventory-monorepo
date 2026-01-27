import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BoxLocation, CreateLocationDto } from '@/services/locationService';
import { locationTypeService } from '@/services/locationTypeService';

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
        parentId: null
    });

    const [locationTypes, setLocationTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);

    useEffect(() => {
        const fetchTypes = async () => {
            if (!isOpen) return;
            setLoadingTypes(true);
            try {
                const types = await locationTypeService.getAll();
                setLocationTypes(types.map(t => t.name));
            } catch (error) {
                console.error('Failed to fetch location types', error);
            } finally {
                setLoadingTypes(false);
            }
        };

        fetchTypes();
    }, [isOpen]);

    useEffect(() => {
        if (!editingLocation && locationTypes.length > 0 && !formData.type) {
            setFormData(prev => ({ ...prev, type: locationTypes[0] }));
        }
    }, [locationTypes, editingLocation]);

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
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
