import { useState, useEffect } from 'react';
import { vendorService, Vendor } from '@/services/vendorService';
import { assetService, Asset } from '@/services/assetService';
import { maintenanceService } from '@/services/maintenanceService';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

export function ServiceModal({ isOpen, onClose, onSuccess, editData }: ServiceModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        asset: '',
        vendor: '',
        type: 'Repair',
        cost: '',
        description: '',
        expectedCompletionDate: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
            if (editData) {
                const assetId = typeof editData.asset === 'object' ? (editData.asset._id || editData.asset.id) : editData.asset;
                const vendorId = typeof editData.vendor === 'object' ? (editData.vendor._id || editData.vendor.id) : editData.vendor;

                setFormData({
                    asset: assetId || '',
                    vendor: vendorId || '',
                    type: editData.type || 'Repair',
                    cost: editData.cost || '',
                    description: editData.description || '',
                    expectedCompletionDate: editData.expectedCompletionDate ? new Date(editData.expectedCompletionDate).toISOString().split('T')[0] : '',
                });
            } else {
                setFormData({
                    asset: '',
                    vendor: '',
                    type: 'Repair',
                    cost: '',
                    description: '',
                    expectedCompletionDate: '',
                });
            }
        }
    }, [isOpen, editData]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assetsRes, vendorsRes] = await Promise.all([
                assetService.getAll({ limit: 100 }),
                vendorService.getAll()
            ]);
            setAssets(assetsRes.data || []);
            setVendors(vendorsRes || []);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                serviceProviderType: 'Vendor',
                cost: Number(formData.cost),
            };

            if (editData) {
                await maintenanceService.update(editData._id, payload);
            } else {
                await maintenanceService.create({ ...payload, status: 'In Progress' });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save service record', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background-dark/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold tracking-tight dark:text-white">
                        {editData ? 'Edit Service Record' : 'Register External Service'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asset Selection</label>
                            <select
                                required
                                value={formData.asset}
                                disabled={loading}
                                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2 disabled:opacity-50"
                            >
                                <option value="">{loading ? 'Loading Assets...' : 'Select Asset...'}</option>
                                {assets.map(asset => (
                                    <option key={asset._id || asset.id} value={asset._id || asset.id}>
                                        {asset.name} ({asset.serial})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vendor Selection</label>
                            <select
                                required
                                value={formData.vendor}
                                disabled={loading}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2 disabled:opacity-50"
                            >
                                <option value="">{loading ? 'Loading Vendors...' : 'Select Vendor...'}</option>
                                {vendors.map(vendor => (
                                    <option key={vendor._id} value={vendor._id}>
                                        {vendor.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2"
                            >
                                <option value="Repair">Repair</option>
                                <option value="Part Replacement">Part Replacement</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Inspection">Inspection</option>
                                <option value="Calibration">Calibration</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected Completion</label>
                            <input
                                type="date"
                                value={formData.expectedCompletionDate}
                                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estimated Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary dark:text-white pl-8 pr-4 py-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-slate-500 dark:text-white px-3 py-2"
                            placeholder="Describe the issue or service required..."
                            rows={3}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (editData ? 'Save Changes' : 'Create Service Record')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
