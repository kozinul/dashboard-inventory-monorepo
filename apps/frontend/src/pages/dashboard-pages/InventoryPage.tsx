import { useState } from 'react';
import { StatsGrid } from '@/features/inventory/components/StatsGrid';
import { AssetTable } from '@/features/inventory/components/AssetTable';
import { inventoryStats, mockAssets, Asset } from '@/features/inventory/data/mock-inventory';
import { AddInventoryModal } from '@/features/inventory/components/AddInventoryModal';

export default function InventoryPage() {
    const [assets, setAssets] = useState<Asset[]>(mockAssets);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddAsset = (newAsset: Omit<Asset, 'id'>) => {
        const asset: Asset = {
            ...newAsset,
            id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
            // In a real app the image would be uploaded, here we just use a placeholder or empty
            image: ''
        };
        setAssets([...assets, asset]);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Master Asset List Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">database</span>
                        Centralized Inventory Database
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">filter_list</span>
                        <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-8 py-2 text-sm font-medium focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                            <option>All Categories</option>
                            <option>Laptops</option>
                            <option>AV Gear</option>
                            <option>Furniture</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add New Asset
                    </button>
                </div>
            </div>

            {/* Stats */}
            <StatsGrid stats={inventoryStats} />

            {/* Table */}
            <AssetTable assets={assets} />

            {/* Add Modal */}
            <AddInventoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddAsset}
            />
        </div>
    );
}
