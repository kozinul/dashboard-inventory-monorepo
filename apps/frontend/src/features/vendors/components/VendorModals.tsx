import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Vendor } from '../../../services/vendorService';

// --- ADD VENDOR MODAL ---

interface AddVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<Vendor, '_id' | 'status'>) => void;
}

export function AddVendorModal({ isOpen, onClose, onAdd }: AddVendorModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<Vendor, '_id' | 'status'>>();

    const onSubmit = (data: Omit<Vendor, '_id' | 'status'>) => {
        onAdd(data);
        reset();
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">storefront</span>
                                    Add New Vendor
                                </Dialog.Title>
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor Name</label>
                                        <input {...register('name', { required: 'Name is required' })} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                    </div>
                                    {/* Contact & Email */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                                            <input {...register('contactName')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input {...register('email')} type="email" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                    </div>
                                    {/* Phone & Website */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                            <input {...register('phone')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                                            <input {...register('website')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                    </div>
                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                        <textarea {...register('address')} rows={3} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"></textarea>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg" onClick={onClose}>Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90">Add Vendor</button>
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

// --- EDIT VENDOR MODAL ---

interface EditVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<Vendor>) => void;
    vendor: Vendor | null;
}

export function EditVendorModal({ isOpen, onClose, onUpdate, vendor }: EditVendorModalProps) {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<Vendor>();

    useEffect(() => {
        if (vendor) {
            setValue('name', vendor.name);
            setValue('contactName', vendor.contactName || '');
            setValue('email', vendor.email || '');
            setValue('phone', vendor.phone || '');
            setValue('website', vendor.website || '');
            setValue('address', vendor.address || '');
            setValue('status', vendor.status);
        }
    }, [vendor, setValue, isOpen]);

    const onSubmit = (data: Vendor) => {
        if (vendor) {
            onUpdate(vendor._id, data);
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">edit_square</span>
                                    Edit Vendor
                                </Dialog.Title>
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor Name</label>
                                        <input {...register('name', { required: 'Name is required' })} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                    </div>
                                    {/* Contact & Email */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                                            <input {...register('contactName')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input {...register('email')} type="email" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                    </div>
                                    {/* Phone & Website */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                            <input {...register('phone')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                                            <input {...register('website')} type="text" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                        </div>
                                    </div>
                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select {...register('status')} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                        <textarea {...register('address')} rows={3} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"></textarea>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg" onClick={onClose}>Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90">Save Changes</button>
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
