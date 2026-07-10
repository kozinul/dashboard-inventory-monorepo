import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Asset, assetService } from "@/services/assetService";
import { getImageUrl } from "@/utils/imageUtils";
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

interface AssetConnectedDevicesTabProps {
    asset: Asset;
}

type ViewMode = 'table' | 'channel';

export function AssetConnectedDevicesTab({ asset }: AssetConnectedDevicesTabProps) {
    const [children, setChildren] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [slotAssigning, setSlotAssigning] = useState<number | null>(null);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);

    const hasSlots = asset.isContainer && (asset.totalSlots ?? 0) > 0;
    const unslottedChildren = children.filter(c => !c.slotNumber);

    useEffect(() => {
        if (asset?._id || asset?.id) {
            loadChildren();
        }
    }, [asset]);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const assetId = asset._id || asset.id;
            if (!assetId) return;
            const data = await assetService.getById(assetId);
            setChildren(data.children || []);
        } catch (error) {
            console.error('Failed to fetch child assets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (deviceId: string) => {
        const result = await Swal.fire({
            title: 'Remove Device?',
            text: 'This will disconnect the device from this parent asset.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Yes, remove'
        });

        if (result.isConfirmed) {
            try {
                await axios.post(`/inventory/items/${deviceId}/dismantle`);
                await loadChildren();
                Swal.fire('Removed', 'Device disconnected.', 'success');
            } catch (error: any) {
                const msg = error.response?.data?.message || 'Failed to remove device';
                Swal.fire('Error', msg, 'error');
            }
        }
    };

    const handleAssignSlot = async (selectedAssetId: string) => {
        if (slotAssigning === null) return;
        try {
            const parentId = asset._id || asset.id;
            await axios.post(`/inventory/items/${selectedAssetId}/install`, {
                parentAssetId: parentId,
                slotNumber: slotAssigning
            });
            setSlotAssigning(null);
            await loadChildren();
            Swal.fire('Installed', `Device assigned to CH ${slotAssigning}`, 'success');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to assign device';
            Swal.fire('Error', msg, 'error');
        }
    };

    const handleQuickAssign = async (deviceId: string) => {
        const firstEmpty = Array.from({ length: totalSlots }, (_, i) => i + 1).find(
            sn => !children.find(c => c.parentAssetId && c.slotNumber === sn)
        );
        if (!firstEmpty) {
            Swal.fire('No Empty Slots', 'All channels are occupied.', 'info');
            return;
        }
        try {
            const parentId = asset._id || asset.id;
            await axios.post(`/inventory/items/${deviceId}/install`, {
                parentAssetId: parentId,
                slotNumber: firstEmpty
            });
            await loadChildren();
            Swal.fire('Installed', `Device assigned to CH ${firstEmpty}`, 'success');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to assign device';
            Swal.fire('Error', msg, 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        );
    }

    const usedCount = children.length;
    const totalSlots = asset.totalSlots ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connected Devices</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {children.length > 0
                            ? `${usedCount} device${usedCount > 1 ? 's' : ''} connected${hasSlots ? ` (${totalSlots - usedCount} available)` : ''}`
                            : 'No devices connected to this asset'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasSlots && (
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm align-text-bottom mr-1">list</span>
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('channel')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    viewMode === 'channel'
                                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm align-text-bottom mr-1">grid_view</span>
                                Channel View
                            </button>
                        </div>
                    )}
                    {asset.isContainer && (
                        <div className="relative">
                            <button
                                onClick={() => {
                                    if (unslottedChildren.length > 0) {
                                        setShowAssignDropdown(!showAssignDropdown);
                                    } else {
                                        Swal.fire('No Unslotted Devices', 'All connected devices already have a channel. Connect new devices via Edit Asset.', 'info');
                                    }
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Assign Device
                            </button>
                            {showAssignDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowAssignDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unslotted Devices</p>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {unslottedChildren.map(c => (
                                                <button
                                                    key={c._id || c.id}
                                                    onClick={() => {
                                                        setShowAssignDropdown(false);
                                                        handleQuickAssign(c._id || c.id!);
                                                    }}
                                                    className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                >
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">videocam</span>
                                                    <div className="min-w-0">
                                                        {c.alias && <p className="text-xs font-semibold text-indigo-500 truncate">{c.alias}</p>}
                                                        <p className="font-medium truncate">{c.name}</p>
                                                        <p className="text-xs text-slate-400 font-mono truncate">{c.serial}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {children.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">device_hub</span>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Connected Devices</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {asset.isContainer
                            ? 'Click "Assign Device" to connect a device to this container.'
                            : 'This asset is not set as a container. Enable "Is Container" in edit mode to manage child assets.'}
                    </p>
                </div>
            )}

            {/* Table View */}
            {children.length > 0 && viewMode === 'table' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Serial</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    {hasSlots && <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Channel</th>}
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {children.map((child) => {
                                    const childId = child._id || child.id;
                                    return (
                                        <tr key={childId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-4 py-3">
                                                {child.alias && <p className="text-xs font-semibold text-indigo-500 truncate max-w-[200px]">{child.alias}</p>}
                                                <Link
                                                    to={`/inventory/asset-details/${childId}`}
                                                    className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {child.name}
                                                </Link>
                                                <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{child.serial}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{child.serial}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    {child.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                                                <span className="material-symbols-outlined text-[10px] align-text-bottom mr-0.5">location_on</span>
                                                {[child.building, child.location, child.locationDetail].filter(Boolean).join(' - ') || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    child.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    child.status === 'in_use' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                                    child.status === 'maintenance' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                }`}>{child.status}</span>
                                            </td>
                                            {hasSlots && (
                                                <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-300">
                                                    {child.slotNumber ? `CH ${child.slotNumber}` : '-'}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleRemove(childId!)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <span className="material-symbols-outlined text-lg">remove_circle</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Channel View */}
            {children.length > 0 && viewMode === 'channel' && hasSlots && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500 text-lg">grid_view</span>
                            {asset.name} — Channel Layout
                        </h4>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {Array.from({ length: totalSlots }, (_, i) => {
                            const slotNum = i + 1;
                            const device = children.find(c => c.slotNumber === slotNum);
                            return { slotNumber: slotNum, device: device || null };
                        }).map((slot) => (
                            <div key={slot.slotNumber} className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg mr-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                                    CH {slot.slotNumber}
                                </div>

                                {slot.device ? (
                                    <div className="flex-1 flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                                {(() => {
                                                    const img = slot.device.images && slot.device.images.length > 0
                                                        ? (typeof slot.device.images[0] === 'string' ? slot.device.images[0] : (slot.device.images[0] as any).url)
                                                        : null;
                                                    return img ? (
                                                        <img src={getImageUrl(img)} alt={slot.device.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">videocam</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="min-w-0">
                                                {slot.device.alias && <p className="text-xs font-semibold text-indigo-500 truncate">{slot.device.alias}</p>}
                                                <Link to={`/inventory/asset-details/${slot.device._id || slot.device.id}`} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                                                    {slot.device.name}
                                                </Link>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{slot.device.serial}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                    <span className="material-symbols-outlined text-[10px] align-text-bottom mr-0.5">location_on</span>
                                                    {[slot.device.building, slot.device.location, slot.device.locationDetail].filter(Boolean).join(' - ') || 'No location'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                slot.device.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                slot.device.status === 'in_use' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                                slot.device.status === 'maintenance' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                            }`}>{slot.device.status}</span>
                                            <button onClick={() => handleRemove((slot.device?._id || slot.device?.id)!)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                                                <span className="material-symbols-outlined text-lg">remove_circle</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-slate-400 italic text-sm">Empty Channel</span>
                                        {slotAssigning === slot.slotNumber ? (
                                            <div className="flex items-center gap-2">
                                                {unslottedChildren.length > 0 ? (
                                                    <select
                                                        className="text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary"
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleAssignSlot(e.target.value);
                                                            }
                                                        }}
                                                        onBlur={() => setSlotAssigning(null)}
                                                        autoFocus
                                                    >
                                                        <option value="">Select device...</option>
                                                        {unslottedChildren.map(c => (
                                                            <option key={c._id || c.id} value={c._id || c.id}>
                                                                {c.alias ? `${c.alias} - ` : ''}{c.name} ({c.serial})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No devices to assign</span>
                                                )}
                                            </div>
                                        ) : unslottedChildren.length > 0 ? (
                                            <button
                                                onClick={() => setSlotAssigning(slot.slotNumber)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg border text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                            >
                                                Assign
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No devices to assign</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
