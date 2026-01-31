import { useState, useEffect } from 'react';
import { maintenanceService } from '@/services/maintenanceService';
import { assetService, Asset } from '@/services/assetService';
import { AssetTable } from '@/features/inventory/components/AssetTable';
import { showSuccessToast, showErrorToast } from '@/utils/swal';

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: any;
}

export function MaintenanceModal({ isOpen, onClose, onSuccess, initialData }: MaintenanceModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        asset: '',
        type: 'Routine',
        description: '',
        status: 'Pending',
        serviceProviderType: 'Internal',
        technician: '', // Ideal: Select from users
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
                status: initialData.status || 'Pending',
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
                status: 'Pending',
                serviceProviderType: 'Internal',
                technician: '',
                cost: 0
            });
            setSelectedAsset(null);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (showAssetSelector && assets.length === 0) {
            assetService.getAll().then((res) => {
                setAssets(res.data || []);
            });
        }
    }, [showAssetSelector]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData) {
                await maintenanceService.update(initialData._id || initialData.id, formData);
                showSuccessToast('Maintenance record updated successfully');
            } else {
                await maintenanceService.create(formData);
                showSuccessToast('Maintenance record created successfully');
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save record:', error);
            showErrorToast('Failed to save record');
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background-dark/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold tracking-tight dark:text-white">
                        {showAssetSelector ? 'Select Asset' : (initialData ? 'Edit Maintenance Record' : 'Log New Maintenance')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {showAssetSelector ? (
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        <div className="mb-4 flex items-center gap-2">
                            <button
                                onClick={() => setShowAssetSelector(false)}
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back to Form
                            </button>
                        </div>
                        <AssetTable
                            assets={assets}
                            onSelect={handleAssetSelect}
                        />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2"
                                placeholder="Maintenance Title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asset</label>
                            {selectedAsset ? (
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold dark:text-white">{selectedAsset.name}</span>
                                        <span className="text-xs text-slate-500">SN: {selectedAsset.serial}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssetSelector(true)}
                                        className="text-xs text-primary font-bold hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAssetSelector(true)}
                                    className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 hover:border-primary hover:text-primary transition-all text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    Select Asset
                                </button>
                            )}
                            <input type="hidden" name="asset" value={formData.asset} required />
                        </div>

                        {initialData && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Issue Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-500 dark:text-white px-3 py-2"
                                placeholder="Briefly describe the maintenance performed..."
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading || !formData.asset}
                                className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
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
