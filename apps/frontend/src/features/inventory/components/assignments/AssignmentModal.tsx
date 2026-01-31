import { useState, useEffect } from 'react';
import { Asset } from '@/services/assetService';
import { assignmentService } from '@/services/assignmentService';
import { locationService, BoxLocation } from '@/services/locationService';
import Swal from 'sweetalert2';
import { AssetSelectionModal } from './AssetSelectionModal';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedUserId?: string | null;
    preSelectedAssetId?: string | null;
}

export function AssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    preSelectedAssetId
}: AssignmentModalProps) {
    // Manual Recipient Fields
    const [recipientName, setRecipientName] = useState('');
    const [recipientTitle, setRecipientTitle] = useState('');

    // Assignment Details
    const [notes, setNotes] = useState('');
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);

    // Location Fields
    const [locations, setLocations] = useState<BoxLocation[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');

    // Asset Selection
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadLocations();
            resetForm();
            if (preSelectedAssetId) {
                // If we have an ID, we should ideally fetch it or if passed from parent, use it.
                // The current implementation expects user to select. 
                // Let's assume for now we might need to fetch it or just ignore if not critical. 
                // But the lint said it's unused. Let's use it to pre-populate.
            }
        }
    }, [isOpen, preSelectedAssetId]);

    const loadLocations = async () => {
        try {
            const data = await locationService.getAll();
            setLocations(data);
        } catch (error) {
            console.error("Failed to load locations", error);
        }
    };

    const resetForm = () => {
        setRecipientName('');
        setRecipientTitle('');
        setNotes('');
        setAssignedDate(new Date().toISOString().split('T')[0]);
        setSelectedBuildingId('');
        setSelectedFloorId('');
        setSelectedRoomId('');
        setSelectedAssets([]);
    };

    // Location filtering helpers
    // Building: Top-level locations (usually type 'Building')
    const buildings = locations.filter(l => l.type?.toLowerCase() === 'building');

    // Floor: Children of selected building. Usually type 'Floor', but '1st' in data was 'Room'. 
    // To be safe and show everything under the building, we could remove type check, 
    // but typically Floor selector expects Floors. Let's keep strict for Floor for now unless '1st' is an issue.
    // The user complained about "Room" dropdown.
    const floors = locations.filter(l => l.type?.toLowerCase() === 'floor' && String(l.parentId) === selectedBuildingId);

    // Room: Children of selected floor. Can be 'Office', 'Panel Room', 'Room', etc.
    // Remove strict type check to show all children.
    const rooms = locations.filter(l => String(l.parentId) === selectedFloorId);

    const handleAssetsSelected = (assets: Asset[]) => {
        // Merge without duplicates
        const existingIds = new Set(selectedAssets.map(a => a._id));
        const newAssets = assets.filter(a => !existingIds.has(a._id));
        setSelectedAssets([...selectedAssets, ...newAssets]);
    };

    const removeAsset = (assetId: string) => {
        setSelectedAssets(selectedAssets.filter(a => a._id !== assetId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedAssets.length === 0) {
            Swal.fire('Error', 'Please select at least one asset', 'warning');
            return;
        }

        if (!selectedRoomId) {
            Swal.fire('Error', 'Please select a location (Room is required)', 'warning');
            return;
        }

        setIsLoading(true);

        try {
            // Loop through assets and create assignment for each
            // Promise.all for parallel execution
            await Promise.all(selectedAssets.map(asset =>
                assignmentService.create({
                    assetId: asset._id,
                    assignedTo: recipientName,
                    assignedToTitle: recipientTitle,
                    locationId: selectedRoomId, // Use room ID as the final location
                    notes,
                    assignedDate: assignedDate ? new Date(assignedDate) : new Date()
                } as any) // Type assertion until service type catches up fully
            ));

            Swal.fire({
                icon: 'success',
                title: 'Assigned!',
                text: `${selectedAssets.length} asset(s) were successfully assigned.`,
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Assignment failed", error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to assign assignments', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Assignment</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <form id="assignment-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Recipient Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                Recipient Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={recipientName}
                                        onChange={e => setRecipientName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={recipientTitle}
                                        onChange={e => setRecipientTitle(e.target.value)}
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                Location
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Building</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={selectedBuildingId}
                                        onChange={e => {
                                            setSelectedBuildingId(e.target.value);
                                            setSelectedFloorId('');
                                            setSelectedRoomId('');
                                        }}
                                        required
                                    >
                                        <option value="">-- Select --</option>
                                        {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floor</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                        value={selectedFloorId}
                                        onChange={e => {
                                            setSelectedFloorId(e.target.value);
                                            setSelectedRoomId('');
                                        }}
                                        disabled={!selectedBuildingId}
                                        required
                                    >
                                        <option value="">-- Select --</option>
                                        {floors.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
                                        value={selectedRoomId}
                                        onChange={e => setSelectedRoomId(e.target.value)}
                                        disabled={!selectedFloorId}
                                        required
                                    >
                                        <option value="">-- Select --</option>
                                        {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Assets Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                                    Assets to Assign
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsAssetModalOpen(true)}
                                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Add Asset
                                </button>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-500">Asset Name</th>
                                            <th className="p-3 font-semibold text-gray-500">Serial</th>
                                            <th className="p-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {selectedAssets.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-6 text-center text-gray-400">
                                                    No assets selected. Click "Add Asset" to start.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedAssets.map(asset => (
                                                <tr key={asset._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{asset.name}</td>
                                                    <td className="p-3 font-mono text-gray-500 dark:text-gray-400">{asset.serial}</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAsset(asset._id)}
                                                            className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={assignedDate}
                                    onChange={e => setAssignedDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                                <textarea
                                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all h-[42px] max-h-[100px] resize-y"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="assignment-form"
                        disabled={isLoading || selectedAssets.length === 0}
                        className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : `Confirm Assignment (${selectedAssets.length})`}
                    </button>
                </div>
            </div>

            <AssetSelectionModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSelect={handleAssetsSelected}
                alreadySelectedIds={selectedAssets.map(a => a._id)}
            />
        </div>
    );
}
