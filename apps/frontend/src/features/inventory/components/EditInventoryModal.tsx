import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { assetService, Asset } from '../../../services/assetService';
import { departmentService, Department } from '../../../services/departmentService';
import { categoryService, Category } from '../../../services/categoryService';
import { uploadService } from '../../../services/uploadService';
import { vendorService, Vendor } from '../../../services/vendorService';

interface EditInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (assetId: string, data: Partial<Asset>) => void;
    asset: Asset | null;
}

interface InventoryFormInputs {
    name: string;
    model: string;
    category: string;
    serial: string;
    departmentId: string;
    // ...
    status: 'active' | 'maintenance' | 'storage' | 'retired' | 'assigned' | 'request maintenance' | 'disposed' | 'in_use';
    parentAssetId?: string; // Add parentAssetId
    requiresExternalService: boolean;
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

export function EditInventoryModal({ isOpen, onClose, onUpdate, asset }: EditInventoryModalProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [allAssets, setAllAssets] = useState<Asset[]>([]); // For parent selection

    // File Upload State
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InventoryFormInputs>();

    const selectedDepartmentId = watch('departmentId');
    const filteredCategories = categories.filter(cat =>
        cat.authorizedDepartments.length === 0 ||
        cat.authorizedDepartments.some(d => d._id === selectedDepartmentId) ||
        (asset && cat.name === asset.category) // Safety: Always include current category
    );

    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Phase 1: Fetch master data when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsDataLoaded(false);
            Promise.all([
                departmentService.getAll(),
                categoryService.getAll(),
                vendorService.getAll(),
                assetService.getAll()
            ]).then(([depts, cats, vends, allAss]) => {
                setDepartments(depts);
                setCategories(cats);
                setVendors(vends.filter(v => v.status === 'active'));
                setAllAssets(allAss.data);
                setIsDataLoaded(true);
            }).catch(err => {
                console.error("Failed to load master data", err);
                setIsDataLoaded(true); // Still set to true to allow form to show what it can
            });
        }
    }, [isOpen]);

    // Phase 2: Populate form once data is loaded AND asset is available
    useEffect(() => {
        if (isOpen && isDataLoaded && asset) {
            const deptId = (asset.departmentId && typeof asset.departmentId === 'object') ? (asset.departmentId as any)._id : asset.departmentId;
            const parentId = (asset.parentAssetId && typeof asset.parentAssetId === 'object') ? (asset.parentAssetId as any)._id : asset.parentAssetId;

            // Prepare full form data for a synchronized reset
            const formData: InventoryFormInputs = {
                name: asset.name,
                model: asset.model,
                category: asset.category,
                serial: asset.serial,
                departmentId: deptId || '',
                parentAssetId: parentId || '',
                status: asset.status,
                requiresExternalService: asset.requiresExternalService || false,
                value: asset.value?.toString() || '0',
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
                vendorName: asset.vendor?.name || '',
                vendorContact: asset.vendor?.contact || '',
                vendorPhone: asset.vendor?.phone || '',
                vendorEmail: asset.vendor?.email || '',
                vendorAddress: asset.vendor?.address || '',
                vendorWebsite: asset.vendor?.website || '',
                warrantyExpiration: asset.warranty?.expirationDate ? new Date(asset.warranty.expirationDate).toISOString().split('T')[0] : '',
                warrantyDetails: asset.warranty?.details || ''
            };

            // Small delay to ensure the browser has finished rendering the <option> elements
            const timer = setTimeout(() => {
                reset(formData); // Use reset for synchronized state

                // Fallback: Manually set dependent fields just in case
                setTimeout(() => {
                    setValue('departmentId', deptId || '');
                    setTimeout(() => {
                        setValue('category', asset.category);
                    }, 50);
                }, 50);

            }, 50);

            return () => clearTimeout(timer);
        }
    }, [isOpen, isDataLoaded, asset, reset, setValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: InventoryFormInputs) => {
        if (!asset) return;

        const selectedDept = departments.find(d => d._id === data.departmentId);

        try {
            setIsUploading(true);
            let invoiceData = asset.invoice; // Keep existing invoice if not replaced

            if (invoiceFile) {
                const uploadResult = await uploadService.upload(invoiceFile, (progress) => {
                    setUploadProgress(progress);
                });
                invoiceData = {
                    number: asset.invoice?.number || '',
                    url: uploadResult.url,
                    filename: uploadResult.filename,
                    uploadDate: new Date().toISOString()
                };
            }

            onUpdate(asset.id || asset._id, {
                ...data,
                departmentId: (data.departmentId || null) as any, // Convert empty string to null for Mongoose
                parentAssetId: (data.parentAssetId || null) as any, // Convert empty string to null for Mongoose
                department: selectedDept?.name || asset.department,
                value: isNaN(Number(data.value)) ? asset.value : Number(data.value),
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
                    expirationDate: data.warrantyExpiration || '',
                    details: data.warrantyDetails
                }
            } as Partial<Asset>);

            onClose();
            setInvoiceFile(null);
            setUploadProgress(0);
        } catch (error) {
            console.error("Failed to update asset", error);
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
                                    <span className="material-symbols-outlined text-primary">edit_square</span>
                                    Edit Asset
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Update the details of the asset.
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
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">Select Category</option>
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
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Asset (Optional)</label>
                                                <select
                                                    {...register('parentAssetId')}
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">None (Top Level)</option>
                                                    {allAssets
                                                        .filter(a => a._id !== asset?._id && a.id !== asset?._id) // Prevent self-parenting
                                                        .map(a => (
                                                            <option key={a._id} value={a._id}>{a.name} ({a.serial})</option>
                                                        ))}
                                                </select>
                                                <p className="text-[10px] text-slate-400 mt-1">Assign if this asset is a component of another asset.</p>
                                            </div>

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
                                                    <option value="assigned">Assigned</option>
                                                    <option value="request maintenance">Request Maintenance</option>
                                                    <option value="disposed">Disposed</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mt-8">
                                                    <input
                                                        type="checkbox"
                                                        id="requiresExternalService"
                                                        {...register('requiresExternalService')}
                                                        className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary dark:bg-slate-800 dark:border-slate-700"
                                                    />
                                                    <label htmlFor="requiresExternalService" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Requires External Service
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Purchase Value</label>
                                                <input
                                                    {...register('value', { required: 'Value is required' })}
                                                    type="text"
                                                    placeholder="e.g. 2499"
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
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Vendor (Autofill)</label>
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
                                                                <span className="text-xs">
                                                                    {asset?.invoice?.url ? 'Click to replace receipt' : 'Click to upload receipt (Img/PDF)'}
                                                                </span>
                                                                {asset?.invoice?.url && (
                                                                    <span className="text-[10px] text-primary">Current: {asset.invoice.filename}</span>
                                                                )}
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
                                                'Save Changes'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
}
