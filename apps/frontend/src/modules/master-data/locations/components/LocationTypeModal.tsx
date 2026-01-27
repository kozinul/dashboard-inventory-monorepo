import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateLocationTypeDto, LocationType, UpdateLocationTypeDto } from '@/services/locationTypeService';

interface LocationTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateLocationTypeDto | UpdateLocationTypeDto) => Promise<void>;
    initialData?: LocationType | null;
}

export function LocationTypeModal({ isOpen, onClose, onSave, initialData }: LocationTypeModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setLevel(initialData.level || 0);
        } else {
            setName('');
            setDescription('');
            setLevel(0);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ name, description, level });
            onClose();
        } catch (error) {
            console.error('Failed to save location type', error);
        } finally {
            setLoading(false);
        }
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
                    <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-surface-dark border border-border-dark px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white">
                                            {initialData ? 'Edit Location Type' : 'Add Location Type'}
                                        </Dialog.Title>
                                        <div className="mt-6">
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-white text-left">
                                                        Name
                                                    </label>
                                                    <div className="mt-2">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            id="name"
                                                            required
                                                            className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="description" className="block text-sm font-medium leading-6 text-white text-left">
                                                        Description
                                                    </label>
                                                    <div className="mt-2">
                                                        <textarea
                                                            name="description"
                                                            id="description"
                                                            rows={3}
                                                            className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="level" className="block text-sm font-medium leading-6 text-white text-left">
                                                        Level (Hierarchical Order)
                                                    </label>
                                                    <p className="text-xs text-text-secondary text-left mb-2">Lower numbers are higher in hierarchy (e.g. 1 for Building, 5 for Rack)</p>
                                                    <div className="mt-2">
                                                        <input
                                                            type="number"
                                                            name="level"
                                                            id="level"
                                                            required
                                                            className="block w-full rounded-md border-0 bg-background-dark py-1.5 text-white shadow-sm ring-1 ring-inset ring-border-dark placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-indigo sm:text-sm sm:leading-6"
                                                            value={level}
                                                            onChange={(e) => setLevel(parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                                    <button
                                                        type="submit"
                                                        className="inline-flex w-full justify-center rounded-md bg-accent-indigo px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-background-dark px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-border-dark hover:bg-opacity-80 sm:col-start-1 sm:mt-0"
                                                        onClick={onClose}
                                                        disabled={loading}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
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
