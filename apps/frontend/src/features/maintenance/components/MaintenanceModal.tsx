import { useState, useEffect } from 'react';
import { maintenanceService } from '@/services/maintenanceService';
import { assetService, Asset } from '@/services/assetService';
import { AssetTable } from '@/features/inventory/components/AssetTable';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { locationService, BoxLocation } from '@/services/locationService';

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: any;
    mode?: 'create' | 'request';
    availableAssets?: Asset[]; // Assets to show in selection
}

export function MaintenanceModal({ isOpen, onClose, onSuccess, initialData, mode = 'create', availableAssets }: MaintenanceModalProps) {
    const { user } = useAuthStore();
    const [formData, setFormData] = useState({
        title: '',
        asset: '',
        type: 'Routine',
        description: '',
        status: 'Sent', // Default to Sent/Pending
        serviceProviderType: 'Internal',
        technician: '',
        cost: 0
    });
    const [loading, setLoading] = useState(false);
    const [showAssetSelector, setShowAssetSelector] = useState(false);
    const [isInternalPanel, setIsInternalPanel] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [locations, setLocations] = useState<BoxLocation[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    // Determine if user can create panel tickets
    const canCreatePanelTicket = ['superuser', 'admin', 'manager', 'dept_admin', 'technician'].includes(user?.role || '');

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                asset: initialData.asset?._id || initialData.asset || '',
                type: initialData.type || 'Routine',
                description: initialData.description || '',
                status: initialData.status || 'Sent',
                serviceProviderType: initialData.serviceProviderType || 'Internal',
                technician: initialData.technician?._id || initialData.technician || '',
                cost: initialData.cost || 0
            });
            setIsInternalPanel(!!initialData.locationTarget);
            setSelectedAsset(initialData.asset);
            setSelectedLocation(initialData.locationTarget);
        } else {
            setFormData({
                title: '',
                asset: '',
                type: 'Routine',
                description: '',
                status: 'Sent',
                serviceProviderType: 'Internal',
                technician: '',
                cost: 0
            });
            setIsInternalPanel(false);
            setSelectedAsset(null);
            setSelectedLocation(null);
        }
    }, [initialData, isOpen]);

    // Reset files when modal opens/closes
    useEffect(() => {
        if (!isOpen) setSelectedFiles(null);
    }, [isOpen]);

    useEffect(() => {
        if (showAssetSelector) {
            if (isInternalPanel) {
                if (locations.length === 0) {
                    locationService.getAll().then((res) => {
                        let filtered = res || [];

                        // Filter to show only locations belonging to the user's department
                        // Admin/Superusers might have access to all, but to prevent clutter we restrict to their department or managed departments.
                        // We also might only want to show infrastructure related types (Panel, Server, etc) but the primary request is to filter by department.
                        const userDepts = [user?.departmentId, ...(user?.managedDepartments || [])].filter(Boolean);

                        if (user?.role !== 'superuser' && userDepts.length > 0) {
                            filtered = filtered.filter(loc => {
                                const locDeptId = typeof loc.departmentId === 'object' ? loc.departmentId?._id : loc.departmentId;
                                return userDepts.includes(locDeptId);
                            });
                        }

                        setLocations(filtered);
                    });
                }
            } else {
                if (availableAssets) {
                    setAssets(availableAssets);
                } else if (assets.length === 0) {
                    assetService.getAll().then((res) => {
                        setAssets(res.data || []);
                    });
                }
            }
        }
    }, [showAssetSelector, isInternalPanel, availableAssets]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData) {
                await maintenanceService.update(initialData._id || initialData.id, formData);
                showSuccessToast('Maintenance record updated successfully');
            } else {
                if (mode === 'request') {
                    // Use createTicket for drafts/user requests
                    const requestData = new FormData();
                    if (isInternalPanel) {
                        requestData.append('locationTarget', selectedLocation._id);
                    } else {
                        requestData.append('asset', formData.asset);
                    }
                    requestData.append('title', formData.title);
                    requestData.append('description', formData.description);
                    requestData.append('type', formData.type);

                    if (selectedFiles) {
                        for (let i = 0; i < selectedFiles.length; i++) {
                            const file = selectedFiles.item(i);
                            if (file) {
                                requestData.append('images', file);
                            }
                        }
                    }

                    await maintenanceService.createTicket(requestData);
                    showSuccessToast('Draft ticket created successfully');
                } else {
                    // Use create for admin direct creation
                    const submitData: any = {
                        ...formData,
                        requestedBy: user?._id
                    };
                    if (isInternalPanel) {
                        delete submitData.asset;
                        submitData.locationTarget = selectedLocation._id;
                    }
                    await maintenanceService.create(submitData);
                    showSuccessToast('Maintenance record created successfully');
                }
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save record:', error);
            showErrorToast(error.response?.data?.message || 'Failed to save record');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssetSelect = (asset: Asset) => {
        setFormData(prev => ({ ...prev, asset: asset._id || asset.id! }));
        setSelectedAsset(asset);
        setShowAssetSelector(false);
    };

    const handleLocationSelect = (loc: BoxLocation) => {
        setSelectedLocation(loc);
        setShowAssetSelector(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className={cn(
                "bg-[#0f172a] w-full rounded-xl border border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
                showAssetSelector ? "max-w-5xl" : "max-w-2xl"
            )}>
                <div className="px-6 py-5 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold tracking-tight text-white">
                        {showAssetSelector ? (isInternalPanel ? 'Select Panel' : 'Select Asset') : (initialData ? 'Edit Maintenance Record' : 'New Maintenance Request')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {showAssetSelector ? (
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#0f172a]">
                        <div className="mb-4 flex items-center gap-2">
                            <button
                                onClick={() => setShowAssetSelector(false)}
                                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Form
                            </button>
                        </div>
                        <div className="dark text-white">
                            {isInternalPanel ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {locations.map((loc) => (
                                        <div key={loc._id} onClick={() => handleLocationSelect(loc)} className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl">dns</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{loc.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {loc.type || 'Panel'}
                                                        {loc.parentId && typeof loc.parentId === 'object' && ` • ${(loc.parentId as any).name}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {locations.length === 0 && (
                                        <div className="col-span-full p-8 text-center text-slate-400">
                                            No panels found for your department.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <AssetTable
                                    assets={assets}
                                    onSelect={handleAssetSelect}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                        {canCreatePanelTicket && !initialData && (
                            <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isInternalPanel"
                                    checked={isInternalPanel}
                                    onChange={(e) => {
                                        setIsInternalPanel(e.target.checked);
                                        setSelectedAsset(null);
                                        setSelectedLocation(null);
                                    }}
                                    className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                />
                                <label htmlFor="isInternalPanel" className="text-sm font-medium text-indigo-300 select-none cursor-pointer flex-1">
                                    This is a request for an Internal Location/Panel
                                </label>
                                <span className="material-symbols-outlined text-indigo-400">dns</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-slate-500 px-4 py-3 transition-all"
                                placeholder="Maintenance Title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {isInternalPanel ? 'Location / Panel' : 'Asset'}
                            </label>
                            {isInternalPanel ? (
                                selectedLocation ? (
                                    <div className="flex items-center justify-between p-3 bg-[#1e293b] border border-slate-700 rounded-lg group hover:border-indigo-500/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{selectedLocation.name}</span>
                                            <span className="text-xs text-slate-500">Type: {selectedLocation.type || 'Panel'}</span>
                                        </div>
                                        <button type="button" onClick={() => setShowAssetSelector(true)} className="text-xs text-indigo-400 font-bold hover:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors">Change</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setShowAssetSelector(true)} className="w-full py-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-all text-sm font-bold flex flex-col items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-2xl">add_location_alt</span>
                                        Select Location/Panel
                                    </button>
                                )
                            ) : (
                                selectedAsset ? (
                                    <div className="flex items-center justify-between p-3 bg-[#1e293b] border border-slate-700 rounded-lg group hover:border-indigo-500/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{selectedAsset.name}</span>
                                            <span className="text-xs text-slate-500">SN: {selectedAsset.serial}</span>
                                        </div>
                                        <button type="button" onClick={() => setShowAssetSelector(true)} className="text-xs text-indigo-400 font-bold hover:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors">Change</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setShowAssetSelector(true)} className="w-full py-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-all text-sm font-bold flex flex-col items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                                        Select Asset
                                    </button>
                                )
                            )}
                            <input type="hidden" name="asset" value={isInternalPanel ? selectedLocation?._id : formData.asset} required={!isInternalPanel} />
                        </div>

                        {initialData && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white px-4 py-3"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Service">Service</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Issue Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-slate-500 px-4 py-3 min-h-[120px]"
                                placeholder="Briefly describe the maintenance performed..."
                                required
                            ></textarea>
                        </div>

                        {mode === 'request' && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Attach Images (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-indigo-400"
                                />
                                {selectedFiles && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        {selectedFiles.length} file(s) selected
                                    </div>
                                )}
                            </div>
                        )}


                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || (!isInternalPanel && !formData.asset) || (isInternalPanel && !selectedLocation)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                            >
                                {loading ? 'Submitting...' : 'Submit Entry'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div >
    );
}
