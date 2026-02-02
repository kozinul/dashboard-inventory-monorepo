import { useState, useEffect } from 'react';
import { maintenanceService } from '@/services/maintenanceService';
import { assetService, Asset } from '@/services/assetService';
import { AssetTable } from '@/features/inventory/components/AssetTable';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';

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
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

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
            setSelectedAsset(initialData.asset);
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
            setSelectedAsset(null);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (showAssetSelector) {
            if (availableAssets) {
                setAssets(availableAssets);
            } else if (assets.length === 0) {
                assetService.getAll().then((res) => {
                    const filtered = (res.data || []).filter((a: any) =>
                        a.status !== 'maintenance' && a.status !== 'under maintenance' && a.status !== 'request maintenance'
                    );
                    setAssets(filtered);
                });
            }
        }
    }, [showAssetSelector, availableAssets]);

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
                    await maintenanceService.createTicket({
                        asset: formData.asset,
                        title: formData.title,
                        description: formData.description,
                        type: formData.type
                    });
                    showSuccessToast('Draft ticket created successfully');
                } else {
                    // Use create for admin direct creation
                    await maintenanceService.create({
                        ...formData,
                        requestedBy: user?._id
                    });
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-[#0f172a] w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold tracking-tight text-white">
                        {showAssetSelector ? 'Select Asset' : (initialData ? 'Edit Maintenance Record' : 'New Maintenance Request')}
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
                        {/* We might need to style AssetTable to match dark theme better, but passing container styles helps */}
                        <div className="dark text-white">
                            <AssetTable
                                assets={assets}
                                onSelect={handleAssetSelect}
                            />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

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
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Asset</label>
                            {selectedAsset ? (
                                <div className="flex items-center justify-between p-3 bg-[#1e293b] border border-slate-700 rounded-lg group hover:border-indigo-500/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{selectedAsset.name}</span>
                                        <span className="text-xs text-slate-500">SN: {selectedAsset.serial}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssetSelector(true)}
                                        className="text-xs text-indigo-400 font-bold hover:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAssetSelector(true)}
                                    className="w-full py-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-all text-sm font-bold flex flex-col items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-2xl">add_circle</span>
                                    Select Asset
                                </button>
                            )}
                            <input type="hidden" name="asset" value={formData.asset} required />
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

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || !formData.asset}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                            >
                                {loading ? 'Submitting...' : 'Submit Entry'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
