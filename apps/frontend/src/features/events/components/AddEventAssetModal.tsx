import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { assetService, Asset } from '@/services/assetService';
import { eventService } from '@/services/eventService';
import { getImageUrl } from '@/utils/imageUtils';

interface AddEventAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onSuccess: () => void;
}

export default function AddEventAssetModal({ isOpen, onClose, eventId, onSuccess }: AddEventAssetModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
            setSelectedAssetIds(new Set());
            setSearchTerm('');
            setSelectedCategory('');
        }
    }, [isOpen]);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const event = await eventService.getById(eventId);
            if (!event) return;

            const response = await assetService.getAvailable({
                startTime: event.startTime.toString(),
                endTime: event.endTime.toString(),
                excludeEventId: eventId,
                departmentId: event.departmentId
            } as any);

            // Filter out assets that are already in this event
            let filteredResponse = response;
            if (event.rentedAssets) {
                const existingAssetIds = new Set(event.rentedAssets.map(ra => (ra.assetId as any)._id || ra.assetId));
                filteredResponse = filteredResponse.filter(asset => !existingAssetIds.has(asset._id || asset.id));
            }

            setAssets(filteredResponse);
        } catch (error) {
            console.error('Failed to fetch available assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const uniqueCategories = new Set(assets.map(a => a.category));
        return Array.from(uniqueCategories).sort();
    }, [assets]);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.serial.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? asset.category === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [assets, searchTerm, selectedCategory]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedAssetIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedAssetIds(newSet);
    };

    const toggleAll = () => {
        if (selectedAssetIds.size === filteredAssets.length) {
            setSelectedAssetIds(new Set());
        } else {
            setSelectedAssetIds(new Set(filteredAssets.map(a => a._id || a.id).filter(Boolean) as string[]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAssetIds.size === 0) return;

        setSubmitting(true);
        try {
            const event = await eventService.getById(eventId);

            const newAssets = Array.from(selectedAssetIds).map(id => {
                const asset = assets.find(a => (a._id || a.id) === id)!;
                const defaultRate = asset.rentalRates?.[0];
                return {
                    assetId: id,
                    rentalRate: defaultRate?.rate || 0,
                    rentalRateUnit: defaultRate?.unit || 'day'
                };
            });

            const updatedAssets = event.rentedAssets ? [...event.rentedAssets, ...newAssets] : newAssets;

            await eventService.update(eventId, { rentedAssets: updatedAssets });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add assets to event:', error);
        } finally {
            setSubmitting(false);
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex flex-col max-h-[90vh] text-left align-middle shadow-xl transition-all">

                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">add_to_queue</span>
                                        Add Rental Assets
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <span className="material-symbols-outlined text-gray-500">close</span>
                                    </button>
                                </div>

                                {/* Filters */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search by name, serial..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={selectedCategory}
                                                onChange={e => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-transparent">
                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-bold bg-gray-50/50 dark:bg-gray-800/50">
                                                    <th className="p-4 w-12">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                            onChange={toggleAll}
                                                            checked={filteredAssets.length > 0 && selectedAssetIds.size === filteredAssets.length}
                                                        />
                                                    </th>
                                                    <th className="p-4">Asset</th>
                                                    <th className="p-4">Serial</th>
                                                    <th className="p-4 text-right">Default Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {filteredAssets.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-gray-500">No available rental assets found matching your criteria.</td>
                                                    </tr>
                                                ) : (
                                                    filteredAssets.map(asset => {
                                                        const assetId = (asset._id || asset.id) as string;
                                                        if (!assetId) return null;

                                                        const isSelected = selectedAssetIds.has(assetId);

                                                        const imageUrlRaw = asset.images && asset.images.length > 0 ? asset.images[0] : null;
                                                        const imgUrlStr = typeof imageUrlRaw === 'string' ? imageUrlRaw : (imageUrlRaw as any)?.url;
                                                        const defaultRate = asset.rentalRates?.[0];

                                                        return (
                                                            <tr
                                                                key={assetId}
                                                                onClick={() => toggleSelection(assetId)}
                                                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                                            >
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleSelection(assetId)}
                                                                    />
                                                                </td>
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                                                            {imgUrlStr ? (
                                                                                <img src={getImageUrl(imgUrlStr)} alt={asset.name} className="size-full object-cover" />
                                                                            ) : (
                                                                                <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-gray-900 dark:text-white">{asset.name}</div>
                                                                            <div className="text-xs text-gray-500">{asset.category} • {asset.model}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-mono text-xs text-gray-500">{asset.serial}</td>
                                                                <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-right">
                                                                    {defaultRate ? (
                                                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">
                                                                            Rp. {defaultRate.rate.toLocaleString('id-ID')} / {defaultRate.unit}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400 italic">No rate</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-500">
                                        {selectedAssetIds.size} assets selected
                                    </span>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className="px-6 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || selectedAssetIds.size === 0}
                                            className="px-6 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Adding...' : 'Add Selected'}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
