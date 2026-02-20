import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Supply, supplyService } from '../../../../services/supplyService';
import { getUnits } from '../../../../services/unitService';
import axios from '../../../../lib/axios';
import { useAuthStore } from '../../../../store/authStore';
import { showSuccess, showError } from '../../../../utils/swal';

interface AddSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
}

export function AddSupplyModal({ isOpen, onClose, onAdd }: AddSupplyModalProps) {
    const { user } = useAuthStore();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Supply>({
        defaultValues: {
            quantity: 0,
            minimumStock: 1,
            cost: 0,
            departmentId: user?.departmentId || ''
        }
    });

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

    // Initial data fetch and form reset
    useEffect(() => {
        if (isOpen) {
            // Step 1: Immediate reset with current defaults
            reset({
                name: '',
                partNumber: '',
                category: '',
                unitId: '',
                quantity: 0,
                minimumStock: 1,
                cost: 0,
                description: '',
                vendorId: '',
                departmentId: user?.departmentId || '',
                locationId: ''
            });

            // Reset local cascade state
            setSelectedBuilding('');
            setSelectedFloor('');

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

                    // Step 2: Auto-select Warehouse & handle cascade
                    const warehouse = allLocations.find((l: any) => l.name.toLowerCase().includes('warehouse'));
                    if (warehouse) {
                        let floor = null;
                        let building = null;

                        if (warehouse.type === 'Building') {
                            building = warehouse;
                        } else {
                            let current = warehouse;
                            const findParent = (id: string) => allLocations.find((l: any) => l._id === id);
                            while (current && current.type !== 'Building') {
                                if (current.type === 'Floor') floor = current;
                                current = findParent(current.parentId);
                            }
                            building = current;
                        }

                        if (building) {
                            setSelectedBuilding(building._id);
                            if (floor) setSelectedFloor(floor._id);

                            // Set locationId after a tick to ensure room options are rendered
                            setTimeout(() => {
                                setValue('locationId', warehouse._id);
                            }, 0);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching dependencies:', error);
                }
            };
            fetchData();
        }
    }, [isOpen, reset]);

    // Secondary effect to ensure Department is synced when user or departments load
    useEffect(() => {
        if (isOpen && user?.departmentId && departments.length > 0) {
            // Small timeout to ensure the DOM has updated with the new options
            setTimeout(() => {
                setValue('departmentId', user.departmentId);
            }, 0);
        }
    }, [isOpen, user?.departmentId, departments.length, setValue]);

    const onSubmit = async (data: Supply) => {
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

            await supplyService.create(finalData);
            await showSuccess('Supply Added!', `${finalData.name} has been successfully added to inventory.`);
            onAdd();
            reset();
            onClose();
        } catch (error: any) {
            console.error('Error saving supply:', error);
            showError('Failed to Save', error.response?.data?.message || 'Something went wrong while saving the supply.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        setSelectedBuilding('');
        setSelectedFloor('');
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
                                    Add New Supply
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Enter details for the new supply item.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Name & Number */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                                <input
                                                    {...register('name', { required: 'Name is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    placeholder="Item Name"
                                                />
                                                {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Part Number / SKU</label>
                                                <input
                                                    {...register('partNumber', { required: 'Part Number is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    placeholder="SKU-1234"
                                                />
                                                {errors.partNumber && <span className="text-xs text-red-500 mt-1">{errors.partNumber.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                                <input
                                                    {...register('category', { required: 'Category is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    placeholder="e.g. Cables, Batteries"
                                                />
                                                {errors.category && <span className="text-xs text-red-500 mt-1">{errors.category.message}</span>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                                                <select
                                                    {...register('unitId', { required: 'Unit is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Unit</option>
                                                    {units.map(u => (
                                                        <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                                                    ))}
                                                </select>
                                                {errors.unitId && <span className="text-xs text-red-500 mt-1">Unit is required</span>}
                                            </div>
                                        </div>

                                        {/* Stock & Location */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                                                    <input
                                                        type="number"
                                                        {...register('quantity', { required: 'Required', min: 0 })}
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min Stock</label>
                                                    <input
                                                        type="number"
                                                        {...register('minimumStock', { required: 'Required', min: 0 })}
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register('cost', { min: 0 })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Building
                                                </label>
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
                                                <select
                                                    {...register('departmentId')}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(dept => (
                                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                        <textarea
                                            {...register('description')}
                                            rows={2}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        />
                                    </div>

                                    {/* Vendor */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
                                        <select
                                            {...register('vendorId')}
                                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select Vendor</option>
                                            {vendors.map(vendor => (
                                                <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Add Supply'}
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
