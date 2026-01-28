import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRightIcon, MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { AssetHero } from "../../features/inventory/components/asset-details/AssetHero";
import { AssetGallery } from "../../features/inventory/components/asset-details/AssetGallery";
import { AssetTabs } from "../../features/inventory/components/asset-details/AssetTabs";
import { AssetDocuments } from "../../features/inventory/components/asset-details/AssetDocuments";
import { assetService, Asset } from "../../services/assetService";

import { EditInventoryModal } from "../../features/inventory/components/EditInventoryModal";
import { showSuccessToast, showErrorToast } from "@/utils/swal";

// Simplified layout to allow document scroll
export default function AssetDetailsPage() {
    const { id } = useParams();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadAsset(id);
        }
    }, [id]);

    const loadAsset = (assetId: string) => {
        setLoading(true);
        assetService.getById(assetId)
            .then(data => {
                setAsset(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch asset", err);
                setError("Failed to load asset details");
                setLoading(false);
            });
    };

    const handleUpdateAsset = async (assetId: string, updatedData: Partial<Asset>) => {
        try {
            await assetService.update(assetId, updatedData);
            // Reload asset data to reflect changes
            if (id) {
                // Determine new ID if they changed unique key, but let's assume route ID is mostly constant or handled. 
                // Ideally reload with current ID.
                const updated = await assetService.getById(id);
                setAsset(updated);
            }
            setIsEditModalOpen(false);
            showSuccessToast('Asset updated successfully!');
        } catch (error) {
            console.error("Failed to update asset:", error);
            showErrorToast('Failed to update asset.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-[#0b1421]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 dark:text-slate-400">Loading asset details...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-[#0b1421]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Asset Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error || "The requested asset could not be found."}</p>
                    <Link to="/inventory" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold">
                        Back to Inventory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-background-light dark:bg-[#0b1421] min-h-screen">
            {/* Top Header */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">Dashboard</Link>
                    <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                    <Link to="/inventory" className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">Inventory</Link>
                    <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-900 dark:text-white">{asset.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-primary w-64 text-slate-900 dark:text-white placeholder-slate-500"
                            placeholder="Search assets..."
                            type="text"
                        />
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-primary rounded-lg border border-slate-200 dark:border-slate-700">
                        <BellIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="px-8 py-6 space-y-8 flex-1 overflow-y-auto">
                <AssetHero asset={asset} onEdit={() => setIsEditModalOpen(true)} />
                <AssetGallery asset={asset} onUpdate={handleUpdateAsset} />
                <AssetTabs asset={asset} />
                <AssetDocuments asset={asset} />
            </div>

            <EditInventoryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateAsset}
                asset={asset}
            />
        </div>
    );
}
