import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Supply, supplyService } from '../../../../services/supplyService';
import { getUnits } from '../../../../services/unitService';
import axios from '@/lib/axios';

interface EditSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    supply: Supply | null;
}

export function EditSupplyModal({ isOpen, onClose, onUpdate, supply }: EditSupplyModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Supply>();

    const [locations, setLocations] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && supply) {
            // Reset form with supply data
            reset({
                ...supply,
                unitId: typeof supply.unitId === 'object' ? (supply.unitId as any)?._id : supply.unitId,
                locationId: typeof supply.locationId === 'object' ? (supply.locationId as any)?._id : supply.locationId,
                vendorId: typeof supply.vendorId === 'object' ? (supply.vendorId as any)?._id : supply.vendorId,
                departmentId: typeof supply.departmentId === 'object' ? (supply.departmentId as any)?._id : supply.departmentId,
            });

            const fetchData = async () => {
                try {
                    const [locRes, vendRes, deptRes, unitRes] = await Promise.all([
                        axios.get('/locations'),
                        axios.get('/vendors'),
                        axios.get('/departments'),
                        getUnits()
                    ]);
                    setLocations(locRes.data);
                    setVendors(vendRes.data);
                    setDepartments(deptRes.data);
                    setUnits(unitRes);
                } catch (error) {
                    console.error('Error fetching dependencies:', error);
                }
            };
            fetchData();
        }
    }, [isOpen, supply, reset]);

    const onSubmit = async (data: Supply) => {
        if (!supply?._id) return;
        try {
            setIsSubmitting(true);
            await supplyService.update(supply._id, data);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating supply:', error);
            alert('Failed to update supply');
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-primary">edit_square</span>
                                    Edit Supply: {supply?.name}
                                </Dialog.Title>
                                <div className="mt-2 text-left">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Update details for this supply item.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                                <input {...register('name', { required: 'Name is required' })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part Number</label>
                                                <input {...register('partNumber', { required: 'Part Number is required' })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                                <input {...register('category', { required: 'Category is required' })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                                                <select {...register('unitId', { required: 'Unit is required' })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary">
                                                    <option value="">Select Unit</option>
                                                    {units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                                                    <input type="number" {...register('quantity', { required: 'Required', min: 0 })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min Stock</label>
                                                    <input type="number" {...register('minimumStock', { required: 'Required', min: 0 })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost</label>
                                                <input type="number" step="0.01" {...register('cost', { min: 0 })} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                                                <select {...register('locationId')} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary">
                                                    <option value="">Select Location</option>
                                                    {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                                <select {...register('departmentId')} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary">
                                                    <option value="">Select Department</option>
                                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                        <textarea {...register('description')} rows={2} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
                                        <select {...register('vendorId')} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary">
                                            <option value="">Select Vendor</option>
                                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                                        </select>
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
                                            {isSubmitting ? 'Updating...' : 'Update Supply'}
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
