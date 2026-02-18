import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Supply, supplyService } from '../../../../services/supplyService';
import { getUnits } from '../../../../services/unitService';
import axios from '@/lib/axios';
import { showSuccess, showError } from '@/utils/swal';

interface EditSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    supply: Supply | null;
}

export function EditSupplyModal({ isOpen, onClose, onUpdate, supply }: EditSupplyModalProps) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Supply>();

    const [locations, setLocations] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Location Cascade State
    const [selectedBuilding, setSelectedBuilding] = useState<string>('');
    const [selectedFloor, setSelectedFloor] = useState<string>('');

    // Filtered lists
    const buildings = locations.filter(l => l.type === 'Building');
    const floors = locations.filter(l => l.type === 'Floor' && l.parentId === selectedBuilding);

    // Get all locations that are not Building or Floor
    const rooms = locations.filter(l => {
        const isBuildingOrFloor = l.type === 'Building' || l.type === 'Floor';
        if (isBuildingOrFloor) return false;

        // If a floor is selected, show items belonging to that floor
        if (selectedFloor) {
            return l.parentId === selectedFloor;
        }

        // If only a building is selected, show items belonging directly to that building
        if (selectedBuilding) {
            return l.parentId === selectedBuilding;
        }

        return false;
    });

    // Initial reset and data fetch
    useEffect(() => {
        if (isOpen && supply) {
            const supplyDeptId = typeof supply.departmentId === 'object' ? (supply.departmentId as any)?._id : supply.departmentId;
            const supplyLocId = typeof supply.locationId === 'object' ? (supply.locationId as any)?._id : supply.locationId;
            const supplyUnitId = typeof supply.unitId === 'object' ? (supply.unitId as any)?._id : supply.unitId;
            const supplyVendorId = typeof supply.vendorId === 'object' ? (supply.vendorId as any)?._id : supply.vendorId;

            // Step 1: Immediate reset with current data
            reset({
                ...supply,
                unitId: supplyUnitId,
                locationId: supplyLocId,
                vendorId: supplyVendorId,
                departmentId: supplyDeptId || '',
            });

            const fetchData = async () => {
                try {
                    const [locRes, vendRes, deptRes, unitRes] = await Promise.all([
                        axios.get('/locations'),
                        axios.get('/vendors'),
                        axios.get('/departments'),
                        getUnits()
                    ]);
                    const allLocations = locRes.data;
                    setLocations(allLocations);
                    setVendors(vendRes.data);
                    setDepartments(deptRes.data);
                    setUnits(unitRes);

                    // Step 2: Handle Location Cascade
                    if (supplyLocId) {
                        const targetLoc = allLocations.find((l: any) => l._id === supplyLocId);
                        if (targetLoc) {
                            let floor = null;
                            let building = null;

                            if (targetLoc.type === 'Building') {
                                building = targetLoc;
                            } else {
                                const findParent = (id: string) => allLocations.find((l: any) => l._id === id);
                                let current = targetLoc;
                                while (current && current.type !== 'Building') {
                                    if (current.type === 'Floor') floor = current;
                                    current = findParent(current.parentId);
                                }
                                building = current;
                            }

                            if (building) {
                                setSelectedBuilding(building._id);
                                if (floor) setSelectedFloor(floor._id);

                                // Set final locationId after options are populated in DOM
                                setTimeout(() => {
                                    setValue('locationId', supplyLocId);
                                }, 0);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching dependencies:', error);
                }
            };
            fetchData();
        }
    }, [isOpen, supply, reset]);

    // Secondary effect for reinforcement (Ensures dropdowns select the correct values once list is populated)
    useEffect(() => {
        if (isOpen && supply) {
            const supplyDeptId = typeof supply.departmentId === 'object' ? (supply.departmentId as any)?._id : supply.departmentId;
            const supplyUnitId = typeof supply.unitId === 'object' ? (supply.unitId as any)?._id : supply.unitId;
            const supplyVendorId = typeof supply.vendorId === 'object' ? (supply.vendorId as any)?._id : supply.vendorId;

            if (departments.length > 0 && supplyDeptId) {
                setTimeout(() => setValue('departmentId', supplyDeptId), 0);
            }
            if (units.length > 0 && supplyUnitId) {
                setTimeout(() => setValue('unitId', supplyUnitId), 0);
            }
            if (vendors.length > 0 && supplyVendorId) {
                setTimeout(() => setValue('vendorId', supplyVendorId), 0);
            }
        }
    }, [isOpen, supply, departments.length, units.length, vendors.length, setValue]);

    const onSubmit = async (data: Supply) => {
        if (!supply?._id) return;
        try {
            setIsSubmitting(true);

            // Fallback to warehouse if no location selected
            let finalData = { ...data };
            if (!finalData.locationId) {
                const warehouse = locations.find(l => l.name.toLowerCase().includes('warehouse'));
                if (warehouse) {
                    finalData.locationId = warehouse._id;
                }
            }

            await supplyService.update(supply._id, finalData);
            await showSuccess('Supply Updated!', `${finalData.name} details have been successfully updated.`);
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating supply:', error);
            showError('Update Failed', error.response?.data?.message || 'Something went wrong while updating the supply.');
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
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Building</label>
                                                <select
                                                    value={selectedBuilding}
                                                    onChange={e => {
                                                        setSelectedBuilding(e.target.value);
                                                        setSelectedFloor('');
                                                    }}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Building</option>
                                                    {buildings.map(b => (
                                                        <option key={b._id} value={b._id}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Floor</label>
                                                <select
                                                    value={selectedFloor}
                                                    onChange={e => setSelectedFloor(e.target.value)}
                                                    disabled={!selectedBuilding}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary disabled:opacity-50"
                                                >
                                                    <option value="">Select Floor</option>
                                                    {floors.map(f => (
                                                        <option key={f._id} value={f._id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room / Location</label>
                                                <select
                                                    {...register('locationId')}
                                                    disabled={!selectedFloor}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary disabled:opacity-50"
                                                >
                                                    <option value="">Select Room</option>
                                                    {rooms.map(r => (
                                                        <option key={r._id} value={r._id}>{r.name}</option>
                                                    ))}
                                                </select>
                                                {errors.locationId && <span className="text-xs text-red-500 mt-1">Location is required</span>}
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
