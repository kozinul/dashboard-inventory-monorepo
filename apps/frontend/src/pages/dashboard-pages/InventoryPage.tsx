import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { StatsGrid } from '@/features/inventory/components/StatsGrid';
import { AssetTable } from '@/features/inventory/components/AssetTable';
// import { inventoryStats, mockAssets, Asset } from '@/features/inventory/data/mock-inventory'; // REMOVED
import { AddInventoryModal } from '@/features/inventory/components/AddInventoryModal';
import { EditInventoryModal } from '@/features/inventory/components/EditInventoryModal';
import { CloneAssetModal } from '@/features/inventory/components/CloneAssetModal';
import { assetService, Asset } from '@/services/assetService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';

import { formatIDR } from '@/utils/currency';

export default function InventoryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        totalAssets: 0,
        totalValue: 0,
        lowStock: 0,
        maintenanceCount: 0
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Clone modal state
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloneAssetId, setCloneAssetId] = useState<string | null>(null);
    const [cloneAssetName, setCloneAssetName] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [assetsData, statsData] = await Promise.all([
                assetService.getAll(),
                assetService.getStats()
            ]);
            setAssets(assetsData.data);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch inventory data:", error);
            // Fallback or toast error here
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddAsset = async (newAsset: any) => {
        try {
            await assetService.create(newAsset);
            fetchData(); // Refresh list
            setIsAddModalOpen(false);
            showSuccessToast('Asset created successfully!');
        } catch (error) {
            console.error("Failed to create asset:", error);
            showErrorToast('Failed to create asset. Please try again.');
        }
    };

    const handleUpdateAsset = async (id: string, updatedData: Partial<Asset>) => {
        try {
            await assetService.update(id, updatedData);
            fetchData();
            setIsEditModalOpen(false);
            setSelectedAsset(null);
            showSuccessToast('Asset updated successfully!');
        } catch (error) {
            console.error("Failed to update asset:", error);
            showErrorToast('Failed to update asset.');
        }
    };

    const handleDeleteAsset = async (id: string) => {
        // Confirm deletion
        const result = await showConfirmDialog('Delete Asset?', "You won't be able to revert this!");
        if (result.isConfirmed) {
            try {
                await assetService.delete(id);
                fetchData();
                showSuccessToast('Asset deleted successfully!');
            } catch (error) {
                console.error("Failed to delete asset:", error);
                showErrorToast('Failed to delete asset.');
            }
        }
    };

    const openEditModal = (id: string) => {
        const asset = assets.find(a => (a.id || a._id) === id);
        if (asset) {
            setSelectedAsset(asset);
            setIsEditModalOpen(true);
        }
    };

    const openCloneModal = (id: string) => {
        const asset = assets.find(a => (a.id || a._id) === id);
        if (asset) {
            setCloneAssetId(id);
            setCloneAssetName(asset.name);
            setIsCloneModalOpen(true);
        }
    };

    const { user } = useAuthStore.getState();
    const canEdit = user?.role === 'admin' || user?.role === 'superuser' || user?.role === 'manager';

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
                    {canEdit && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Add New Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <StatsGrid stats={[
                { label: 'Total Assets', value: stats.totalAssets, icon: 'inventory_2', delta: '+12%', trend: 'success', iconColor: 'text-blue-500' },
                { label: 'Total Value', value: formatIDR(stats.totalValue), icon: 'payments', delta: '+5%', trend: 'success', iconColor: 'text-emerald-500' },
                { label: 'Low Stock', value: stats.lowStock, icon: 'warning', delta: '2 items', trend: 'warning', iconColor: 'text-amber-500' },
                { label: 'In Maintenance', value: stats.maintenanceCount, icon: 'build', delta: '-1', trend: 'neutral', iconColor: 'text-purple-500' }
            ]} />

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <AssetTable
                    assets={assets}
                    onEdit={canEdit ? openEditModal : undefined}
                    onDelete={canEdit ? handleDeleteAsset : undefined}
                    onClone={canEdit ? openCloneModal : undefined}
                />
            )}

            {/* Add Modal */}
            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddAsset}
            />

            {/* Edit Modal */}
            <EditInventoryModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedAsset(null);
                }}
                onUpdate={handleUpdateAsset}
                asset={selectedAsset}
            />

            {/* Clone Modal */}
            <CloneAssetModal
                isOpen={isCloneModalOpen}
                onClose={() => {
                    setIsCloneModalOpen(false);
                    setCloneAssetId(null);
                    setCloneAssetName('');
                }}
                assetId={cloneAssetId}
                assetName={cloneAssetName}
                onSuccess={fetchData}
            />
        </div>
    );
}

