import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Asset } from '../../../services/assetService';
import { departmentService, Department } from '../../../services/departmentService';
import { categoryService, Category } from '../../../services/categoryService';
import { uploadService } from '../../../services/uploadService';
import { vendorService, Vendor } from '../../../services/vendorService';

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
    departmentId: string;
    status: 'active' | 'maintenance' | 'storage' | 'retired';
    value: string;
    purchaseDate: string;

    // Vendor Fields
    vendorName: string;
    vendorContact: string;
    vendorPhone: string;
    vendorEmail: string;
    vendorAddress: string;
    vendorWebsite: string;

    // Warranty Fields
    warrantyExpiration: string;
    warrantyDetails: string;
}

export function AddInventoryModal({ isOpen, onClose, onAdd }: AddInventoryModalProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    // File Upload State
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Watch departmentId to filter categories
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InventoryFormInputs>({
        defaultValues: {
            status: 'active'
        }
    });

    const selectedDepartmentId = watch('departmentId');
    const filteredCategories = categories.filter(cat =>
        cat.authorizedDepartments.length === 0 ||
        cat.authorizedDepartments.some(d => d._id === selectedDepartmentId)
    );

    useEffect(() => {
        if (isOpen) {
            departmentService.getAll().then(data => {
                setDepartments(data);
            }).catch(err => console.error("Failed to load departments", err));

            categoryService.getAll().then(data => {
                setCategories(data);
            }).catch(err => console.error("Failed to load categories", err));

            vendorService.getAll().then(data => {
                setVendors(data.filter(v => v.status === 'active'));
            }).catch(err => console.error("Failed to load vendors", err));
        }
    }, [isOpen]);

    // Reset category when department changes
    useEffect(() => {
        setValue('category', '');
    }, [selectedDepartmentId, setValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: InventoryFormInputs) => {
        const selectedDept = departments.find(d => d._id === data.departmentId);

        try {
            setIsUploading(true);
            let invoiceData = undefined;

            if (invoiceFile) {
                const uploadResult = await uploadService.upload(invoiceFile, (progress) => {
                    setUploadProgress(progress);
                });
                invoiceData = {
                    number: '', // Could add field for invoice number if needed
                    url: uploadResult.url,
                    filename: uploadResult.filename,
                    uploadDate: new Date().toISOString()
                };
            }

            const assetData: any = {
                name: data.name,
                model: data.model,
                category: data.category,
                serial: data.serial,
                departmentId: data.departmentId,
                department: selectedDept?.name || 'Unknown',
                status: data.status,
                value: parseFloat(data.value.replace(/[^0-9.]/g, '')), // Basic cleaning
                purchaseDate: data.purchaseDate,
                images: [],
                vendor: {
                    name: data.vendorName,
                    contact: data.vendorContact,
                    phone: data.vendorPhone,
                    email: data.vendorEmail,
                    address: data.vendorAddress,
                    website: data.vendorWebsite
                },
                invoice: invoiceData,
                warranty: {
                    expirationDate: data.warrantyExpiration,
                    details: data.warrantyDetails
                }
            };

            onAdd(assetData);

            // Reset form and local state
            reset();
            setInvoiceFile(null);
            setUploadProgress(0);
            onClose();
        } catch (error) {
            console.error("Failed to add asset", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        reset();
        setInvoiceFile(null);
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
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary disabled:opacity-50"
                                                    disabled={!selectedDepartmentId}
                                                >
                                                    <option value="">{selectedDepartmentId ? 'Select Category' : 'Select Department First'}</option>
                                                    {filteredCategories.map(cat => (
                                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                                    ))}
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

                                        {/* Status & Department */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                                <select
                                                    {...register('departmentId', { required: 'Department is required' })}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map((dept) => (
                                                        <option key={dept._id} value={dept._id}>
                                                            {dept.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.departmentId && <span className="text-xs text-red-500 mt-1">{errors.departmentId.message}</span>}
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
                                                    placeholder="e.g. 2500000"
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

                                    {/* Vendor & Invoice Section */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Purchasing & Vendor Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Vendor (Optional)</label>
                                                    <select
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                        onChange={(e) => {
                                                            const vendorId = e.target.value;
                                                            if (vendorId) {
                                                                const vendor = vendors.find(v => v._id === vendorId);
                                                                if (vendor) {
                                                                    setValue('vendorName', vendor.name);
                                                                    setValue('vendorContact', vendor.contactName || '');
                                                                    setValue('vendorPhone', vendor.phone || '');
                                                                    setValue('vendorEmail', vendor.email || '');
                                                                    setValue('vendorAddress', vendor.address || '');
                                                                    setValue('vendorWebsite', vendor.website || '');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <option value="">-- Choose from existing vendors --</option>
                                                        {vendors.map(v => (
                                                            <option key={v._id} value={v._id}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor Name</label>
                                                    <input
                                                        {...register('vendorName')}
                                                        type="text"
                                                        placeholder="e.g. Official Store"
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor Website</label>
                                                    <input
                                                        {...register('vendorWebsite')}
                                                        type="text"
                                                        placeholder="e.g. https://store.com"
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice / Receipt Scan</label>
                                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 text-center relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={handleFileChange}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        {invoiceFile ? (
                                                            <div className="flex items-center justify-center gap-2 text-primary">
                                                                <span className="material-symbols-outlined">description</span>
                                                                <span className="text-sm font-medium truncate max-w-[200px]">{invoiceFile.name}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                                <span className="material-symbols-outlined text-2xl">upload_file</span>
                                                                <span className="text-xs">Click to upload receipt (Img/PDF)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person / Phone</label>
                                                    <input
                                                        {...register('vendorContact')}
                                                        type="text"
                                                        placeholder="Name or Phone number"
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warranty Expiration</label>
                                                    <input
                                                        {...register('warrantyExpiration')}
                                                        type="date"
                                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
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
                                            disabled={isUploading}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Saving...'}
                                                </>
                                            ) : (
                                                'Add Asset'
                                            )}
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
