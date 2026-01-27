import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Asset } from '../data/mock-inventory';
import { ImageUploader } from '../../../components/common/ImageUploader';

interface AddInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (asset: Omit<Asset, 'id'>) => void;
}

interface InventoryFormInputs {
    name: string;
    model: string;
    category: string;
    serial: string;
    location: string;
    status: 'active' | 'maintenance' | 'storage' | 'retired';
    value: string;
    purchaseDate: string;
}

export function AddInventoryModal({ isOpen, onClose, onAdd }: AddInventoryModalProps) {
    const [imageFile, setImageFile] = useState<File | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<InventoryFormInputs>({
        defaultValues: {
            status: 'active'
        }
    });

    const onSubmit = (data: InventoryFormInputs) => {
        // In a real app, we'd upload the file here. 
        // For local mock, we create a temporary object URL.
        const imageUrl = imageFile ? URL.createObjectURL(imageFile) : '';

        onAdd({
            ...data,
            image: imageUrl,
        });

        // Reset form and local state
        reset();
        setImageFile(null);
        onClose();
    };

    const handleClose = () => {
        reset();
        setImageFile(null);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-primary">add_circle</span>
                                    Add New Asset
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Enter the details of the new equipment or asset to track in the inventory.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                                    {/* Image Uploader */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Asset Photo</label>
                                        <ImageUploader onChange={setImageFile} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Basic Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                                                <input
                                                    {...register('name', { required: 'Name is required' })}
                                                    type="text"
                                                    placeholder="e.g. MacBook Pro"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model / Specs</label>
                                                <input
                                                    {...register('model', { required: 'Model is required' })}
                                                    type="text"
                                                    placeholder="e.g. M3 Max, 32GB"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.model && <span className="text-xs text-red-500 mt-1">{errors.model.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                                <select
                                                    {...register('category', { required: 'Category is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Laptops">Laptops</option>
                                                    <option value="AV Gear">AV Gear</option>
                                                    <option value="Workstations">Workstations</option>
                                                    <option value="Audio">Audio</option>
                                                    <option value="Lighting">Lighting</option>
                                                    <option value="Furniture">Furniture</option>
                                                </select>
                                                {errors.category && <span className="text-xs text-red-500 mt-1">{errors.category.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
                                                <input
                                                    {...register('serial', { required: 'Serial is required' })}
                                                    type="text"
                                                    placeholder="e.g. SN-123456"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.serial && <span className="text-xs text-red-500 mt-1">{errors.serial.message}</span>}
                                            </div>
                                        </div>

                                        {/* Status & Location */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                                                <input
                                                    {...register('location', { required: 'Location is required' })}
                                                    type="text"
                                                    placeholder="e.g. Design Studio A"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.location && <span className="text-xs text-red-500 mt-1">{errors.location.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                                <select
                                                    {...register('status')}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="maintenance">Maintenance</option>
                                                    <option value="storage">Storage</option>
                                                    <option value="retired">Retired</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase Value</label>
                                                <input
                                                    {...register('value', { required: 'Value is required' })}
                                                    type="text"
                                                    placeholder="e.g. $2,499"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.value && <span className="text-xs text-red-500 mt-1">{errors.value.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase Date</label>
                                                <input
                                                    {...register('purchaseDate', { required: 'Date is required' })}
                                                    type="date"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                                {errors.purchaseDate && <span className="text-xs text-red-500 mt-1">{errors.purchaseDate.message}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 transition-all"
                                        >
                                            Add Asset
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
