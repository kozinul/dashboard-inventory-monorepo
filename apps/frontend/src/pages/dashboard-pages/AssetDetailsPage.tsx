import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import { MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { AssetHero } from "../../features/inventory/components/asset-details/AssetHero";
import { AssetGallery } from "../../features/inventory/components/asset-details/AssetGallery";
import { TechnicalSpecsEditor } from "../../features/inventory/components/asset-details/TechnicalSpecsEditor";
import { AssetPurchasingTab } from "../../features/inventory/components/asset-details/AssetPurchasingTab";
import { AssetAssignmentTab } from "../../features/inventory/components/asset-details/AssetAssignmentTab";
import { AssetServiceTab } from "../../features/inventory/components/asset-details/AssetServiceTab";
import { AssetDocuments } from "../../features/inventory/components/asset-details/AssetDocuments";
import { AssetMaintenanceTab } from "../../features/inventory/components/asset-details/AssetMaintenanceTab";
import { AssetActivityLogTab } from "../../features/inventory/components/asset-details/AssetActivityLogTab";
import { assetService, Asset } from "../../services/assetService";
import axios from '@/lib/axios';

import { EditInventoryModal } from "../../features/inventory/components/EditInventoryModal";
import { showSuccessToast, showErrorToast } from "@/utils/swal";
import BookingHistoryTable from '@/features/rental/components/BookingHistoryTable';

// Simplified layout to allow document scroll
export default function AssetDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [allLocations, setAllLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'technical_info' | 'purchasing' | 'documents' | 'rental_rates' | 'assignments' | 'rental_history' | 'external_services' | 'maintenance' | 'activity_log'>('technical_info');

    const { setBreadcrumb } = useBreadcrumb();
    const location = useLocation();

    useEffect(() => {
        if (id) {
            loadAsset(id);
        }
    }, [id]);

    useEffect(() => {
        if (asset && asset.name) {
            setBreadcrumb(location.pathname, asset.name);
        }
    }, [asset, location.pathname, setBreadcrumb]);

    const loadAsset = async (assetId: string) => {
        setLoading(true);
        try {
            // First fetch all locations to compute path
            const locationsRes = await axios.get('/locations');
            setAllLocations(locationsRes.data);

            const data = await assetService.getById(assetId);
            setAsset(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch asset", err);
            setError("Failed to load asset details");
            setLoading(false);
        }
    };

    const getLocationPath = () => {
        // 1. If we have a specific locationId, build the full path
        if (asset && asset.locationId) {
            const path: string[] = [];
            let currentId = typeof asset.locationId === 'string' ? asset.locationId : (asset.locationId as any)._id;

            while (currentId) {
                const currentLoc = allLocations.find(l => l._id === currentId);
                if (currentLoc) {
                    path.unshift(currentLoc.name);
                    currentId = currentLoc.parentId;
                } else {
                    break;
                }
            }

            let fullPath = path.length > 0 ? path.join(' > ') : (asset.location || 'Unassigned');
            if (asset.slotNumber) {
                fullPath += ` (Slot ${asset.slotNumber})`;
            }
            return fullPath;
        }

        // 2. If no locationId, look for the department's default warehouse
        if (asset) {
            const assetDeptId = typeof asset.departmentId === 'object' ? (asset.departmentId as any)._id : asset.departmentId;
            const warehouseLoc = allLocations.find(l =>
                l.isWarehouse === true &&
                (typeof l.departmentId === 'object' ? l.departmentId._id === assetDeptId : l.departmentId === assetDeptId)
            );

            if (warehouseLoc) {
                return warehouseLoc.name;
            }
        }

        return asset?.location || 'Unassigned';
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
                    {/* Breadcrumbs removed to avoid duplication with global layout */}
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
                <AssetHero asset={asset} onEdit={() => setIsEditModalOpen(true)} currentLocation={getLocationPath()} />
                <AssetGallery asset={asset} onUpdate={handleUpdateAsset} />

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-slate-800 rounded-t-xl">
                    <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
                        {[
                            { id: 'technical_info', label: 'Technical Info' },
                            { id: 'purchasing', label: 'Purchasing' },
                            { id: 'documents', label: 'Documents' },
                            { id: 'assignments', label: 'Assignments' },
                            { id: 'rental_history', label: 'Rental History' },
                            { id: 'external_services', label: 'External Services' },
                            { id: 'maintenance', label: 'Maintenance' },
                            { id: 'activity_log', label: 'Activity Log' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                                    } whitespace-nowrap border-b-2 py-4 px-6 text-sm font-medium transition-colors`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="min-h-[400px] bg-white dark:bg-slate-800 rounded-b-xl p-6 border-x border-b border-gray-200 dark:border-gray-700">
                    {activeTab === 'technical_info' && <TechnicalSpecsEditor asset={asset} onUpdate={() => loadAsset(id!)} />}
                    {activeTab === 'purchasing' && <AssetPurchasingTab asset={asset} />}
                    {activeTab === 'documents' && <AssetDocuments asset={asset} onUpdate={() => loadAsset(id!)} />}
                    {activeTab === 'assignments' && <AssetAssignmentTab asset={asset} />}
                    {activeTab === 'rental_history' && id && <BookingHistoryTable assetId={id} />}
                    {activeTab === 'external_services' && <AssetServiceTab asset={asset} />}

                    {activeTab === 'maintenance' && <AssetMaintenanceTab asset={asset} />}
                    {activeTab === 'activity_log' && <AssetActivityLogTab asset={asset} />}

                </div>
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
