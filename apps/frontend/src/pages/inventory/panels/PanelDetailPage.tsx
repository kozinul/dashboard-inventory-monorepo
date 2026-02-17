import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { locationService, BoxLocation } from '@/services/locationService';
import { ServerIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { AssetSelectionModal } from '@/features/inventory/components/AssetSelectionModal';

interface Asset {
    _id: string;
    name: string;
    slotNumber?: number;
    status: string;
    departmentId?: { name: string };
    department?: string;
}

export default function PanelDetailPage() {
    const { id } = useParams();
    const [panel, setPanel] = useState<BoxLocation | null>(null);
    const [allLocations, setAllLocations] = useState<BoxLocation[]>([]);
    const [slots, setSlots] = useState<Asset[][]>([]); // Array of arrays of assets
    const [loading, setLoading] = useState(true);

    // Selection Modal State
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        if (id) fetchPanelDetails();
    }, [id]);

    const fetchPanelDetails = async () => {
        try {
            if (!id) return;

            // Get ALL Locations to build hierarchy paths
            const locationsRes = await axios.get('/locations');
            setAllLocations(locationsRes.data);

            // Get Location Details (The Rack/Panel)
            const panelData = await locationService.getById(id);
            setPanel(panelData);

            // Get Assets in this Location
            // We filter by locationId
            const childrenRes = await axios.get(`/inventory?locationId=${id}`);
            const children = childrenRes.data.data;

            // Map children to slots
            // Group multiple assets per slot
            const capacity = panelData.capacity || 0;
            const slotArray: Asset[][] = Array.from({ length: capacity }, () => []);

            children.forEach((child: Asset) => {
                if (child.slotNumber && child.slotNumber > 0 && child.slotNumber <= capacity) {
                    slotArray[child.slotNumber - 1].push(child);
                }
            });
            setSlots(slotArray);

        } catch (error) {
            console.error('Failed to fetch panel details', error);
            Swal.fire('Error', 'Failed to load panel details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getLocationPath = () => {
        if (!panel) return 'Root';
        const path: string[] = [];
        let current: any = panel;

        while (current?.parentId) {
            const parentId = typeof current.parentId === 'string' ? current.parentId : current.parentId._id;
            const parent = allLocations.find(l => l._id === parentId);
            if (parent) {
                path.unshift(parent.name);
                current = parent;
            } else {
                break;
            }
        }

        return path.length > 0 ? path.join(' > ') : 'Root';
    };

    const handleRemoveAsset = async (assetId: string) => {
        // Implementation for removing asset from slot
        // Update asset: set locationId=RackID (keep it in rack? or remove?), slotNumber=null
        // User likely wants to "Unmount" it. 
        // Logic: dismantleAsset controller endpoint? Or just update.
        // Let's use the dismantle endpoint if it exists, or update manually.
        // The dismantle endpoint likely clears parentAssetId. We need it to clear locationId or just slotNumber.
        // Let's stick to the previous 'dismantle' logic but adapted: 
        // Actually, if we use the backend 'dismantle', it sets parentAssetId=null. 
        // We might need to update it to handle locationId=null or just slotNumber=null.
        // For now, let's just update the asset directly to remove it from the slot but keep it in the location (or remove from location?)
        // "Dismantle" usually means taking it out of the rack entirely.

        try {
            const result = await Swal.fire({
                title: 'Dismantle Asset?',
                text: "This will remove the asset from the rack and return it to the warehouse.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'Yes, dismantle'
            });

            if (result.isConfirmed) {
                await axios.post(`/inventory/items/${assetId}/dismantle`);
                fetchPanelDetails(); // Refresh
                Swal.fire('Dismantled', 'Asset returned to warehouse.', 'success');
            }
        } catch (error) {
            console.error('Failed to remove asset', error);
            Swal.fire('Error', 'Failed to remove asset', 'error');
        }
    };

    const handleAssignAsset = (slotIndex: number) => {
        setActiveSlotIndex(slotIndex);
        setIsSelectionModalOpen(true);
    };

    const onAssetSelected = async (assetId: string) => {
        if (activeSlotIndex === null) return;

        try {
            // Use the install endpoint
            await axios.post(`/inventory/items/${assetId}/install`, {
                locationId: id,      // The Rack ID is the Location ID
                slotNumber: activeSlotIndex + 1
            });

            setIsSelectionModalOpen(false);
            fetchPanelDetails();
            Swal.fire('Installed!', 'Asset has been installed in the rack.', 'success');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to install asset';
            Swal.fire('Error', message, 'error');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!panel) return <div>Panel not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/inventory/panels" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{panel.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getLocationPath()} • {panel.capacity || 0}{panel.type === 'Rack' ? 'U' : ' Slots'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-indigo-500" />
                        Rack View
                    </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {slots.map((assetsInSlot, index) => (
                        <div key={index} className="flex items-start p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-lg mr-4 font-mono font-bold text-gray-500 dark:text-gray-400 mt-1">
                                {panel.type === 'Rack' ? `${index + 1}U` : index + 1}
                            </div>

                            <div className="flex-1 flex flex-col gap-3">
                                {assetsInSlot.length > 0 ? (
                                    <>
                                        {assetsInSlot.map((asset) => (
                                            <div key={asset._id} className="flex justify-between items-center group/item">
                                                <div>
                                                    <Link to={`/inventory/asset-details/${asset._id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        {asset.name}
                                                    </Link>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex gap-2">
                                                        <span className="capitalize">{asset.status.replace('_', ' ')}</span>
                                                        {(asset.departmentId?.name || asset.department) && (
                                                            <span className="text-indigo-500">
                                                                • {asset.departmentId?.name || asset.department}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAsset(asset._id)}
                                                    className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {/* Show add button even if occupied to support shared slots */}
                                        <div className="pt-2 border-t border-dashed border-gray-100 dark:border-slate-700">
                                            <button
                                                onClick={() => handleAssignAsset(index)}
                                                className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                            >
                                                + Add another device to this slot
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between items-center h-12">
                                        <span className="text-gray-400 italic text-sm">Empty Slot</span>
                                        <button
                                            onClick={() => handleAssignAsset(index)}
                                            className="text-xs text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-gray-300 dark:border-slate-600 hover:border-indigo-400 px-3 py-1 rounded"
                                        >
                                            + Assign
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {slots.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No slots configured. Edit the Location to add capacity.
                        </div>
                    )}
                </div>
            </div>

            <AssetSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onSelect={onAssetSelected}
                title={activeSlotIndex !== null ? `Install Asset at ${panel.type === 'Rack' ? (activeSlotIndex + 1) + 'U' : 'Slot ' + (activeSlotIndex + 1)}` : "Select Asset"}
                branchId={panel?.branchId}
                departmentId={typeof panel?.departmentId === 'string' ? panel.departmentId : panel?.departmentId?._id}
            />
        </div>
    );
}
