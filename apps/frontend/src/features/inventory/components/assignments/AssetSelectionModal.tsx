import { useState, useEffect } from 'react';
import { Asset } from '@/services/assetService';
import { assetService } from '@/services/assetService';

interface AssetSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (assets: Asset[]) => void;
    alreadySelectedIds: string[];
}

export function AssetSelectionModal({ isOpen, onClose, onSelect, alreadySelectedIds }: AssetSelectionModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadAssets();
            setSelectedIds(new Set());
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        filterAssets();
    }, [searchTerm, assets]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const response = await assetService.getAll();
            // Filter only available assets (active and not in maintenance/retired)
            // And also filter out already selected ones in the parent form (optional, but good UX)
            // Actually, keep them but disable or mark as selected if we pass them.
            // For now, simple filter for status.

            // Backend should theoretically handle "assignable" logic but let's filter 'active'
            const available = response.data.filter((a: Asset) => a.status === 'active' && !alreadySelectedIds.includes(a._id));
            setAssets(available);
        } catch (error) {
            console.error("Failed to load assets", error);
        } finally {
            setLoading(false);
        }
    };

    const filterAssets = () => {
        if (!searchTerm) {
            setFilteredAssets(assets);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const filtered = assets.filter(a =>
            a.name.toLowerCase().includes(lower) ||
            a.serial.toLowerCase().includes(lower) ||
            a.category.toLowerCase().includes(lower)
        );
        setFilteredAssets(filtered);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        const selected = assets.filter(a => selectedIds.has(a._id));
        onSelect(selected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Assets</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Choose assets to add to this assignment in bulk</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Search by name, serial, or category..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table list */}
                <div className="flex-1 overflow-y-auto p-6">
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
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(new Set(filteredAssets.map(a => a._id)));
                                                } else {
                                                    setSelectedIds(new Set());
                                                }
                                            }}
                                            checked={filteredAssets.length > 0 && selectedIds.size === filteredAssets.length}
                                        />
                                    </th>
                                    <th className="p-4">Asset</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Serial</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">No assets found matching your search.</td>
                                    </tr>
                                ) : (
                                    filteredAssets.map(asset => (
                                        <tr
                                            key={asset._id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${selectedIds.has(asset._id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                            onClick={() => toggleSelection(asset._id)}
                                        >
                                            <td className="p-4 relative" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                    checked={selectedIds.has(asset._id)}
                                                    onChange={() => toggleSelection(asset._id)}
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                                            <td className="p-4 text-gray-500 dark:text-gray-400">{asset.category}</td>
                                            <td className="p-4 font-mono text-xs text-gray-500">{asset.serial}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded text-xs font-bold uppercase">
                                                    {asset.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">{selectedIds.size} assets selected</span>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Add Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
