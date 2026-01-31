import { useState, useEffect } from 'react';
import { assignmentService } from '@/services/assignmentService';
import { locationService, BoxLocation } from '@/services/locationService';
import { RecipientGroup } from './RecipientListTable';
import Swal from 'sweetalert2';

interface EditRecipientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    recipient: RecipientGroup | null;
}

export function EditRecipientModal({
    isOpen,
    onClose,
    onSuccess,
    recipient
}: EditRecipientModalProps) {
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');

    // Location State
    const [locations, setLocations] = useState<BoxLocation[]>([]);
    const [buildings, setBuildings] = useState<BoxLocation[]>([]);
    const [floors, setFloors] = useState<BoxLocation[]>([]);
    const [rooms, setRooms] = useState<BoxLocation[]>([]);

    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedFloorId, setSelectedFloorId] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);

    // Current Location Display
    const [currentLocationString, setCurrentLocationString] = useState<string>('Not set');

    // Helper to traverse up the tree to build location string
    const buildLocationString = (locationId: string | BoxLocation, allLocations: BoxLocation[]) => {
        let loc: BoxLocation | undefined;

        // Resolve the starting location object
        if (typeof locationId === 'string') {
            loc = allLocations.find(l => l._id === locationId);
        } else {
            loc = locationId;
        }

        if (!loc) return '';

        const parts: string[] = [];
        const type = loc.type?.toLowerCase();

        // If we can't traverse parents (child not in allLocations or no parentId header), 
        // at least return the name we have.
        // We'll try to climb the tree if possible.

        // Start with the leaf (Room)
        parts.unshift(loc.name);

        // Try to find parent (Floor)
        if (loc.parentId) {
            const floor = allLocations.find(l => l._id === loc.parentId);
            if (floor) {
                parts.unshift(floor.name);

                // Try to find grandparent (Building)
                if (floor.parentId) {
                    const building = allLocations.find(l => l._id === floor.parentId);
                    if (building) {
                        parts.unshift(building.name);
                    }
                }
            }
        }

        return parts.join(' - ');
    };

    const fetchLocations = async () => {
        try {
            const data = await locationService.getAll();
            setLocations(data);

            // Filter buildings (root level usually, or type='building')
            const bldgs = data.filter(l => (l.type?.toLowerCase() === 'building' || !l.parentId) && l.status !== 'Inactive');
            setBuildings(bldgs);

            // Now that we have locations, we can compute the string
            if (recipient) {
                const activeAssignment = recipient.assignments.find(a => a.status === 'assigned') || recipient.assignments[0];
                if (activeAssignment && activeAssignment.locationId) {
                    const locId = (typeof activeAssignment.locationId === 'object')
                        ? (activeAssignment.locationId as any)._id
                        : activeAssignment.locationId;

                    const locObj = (typeof activeAssignment.locationId === 'object') ? activeAssignment.locationId as unknown as BoxLocation : undefined;

                    // Try to build string with full tree
                    let str = buildLocationString(locId, data);

                    // Fallback if tree traversal failed but we have a populated object name
                    if ((!str || str === '') && locObj) {
                        str = locObj.name;
                    }

                    setCurrentLocationString(str || 'Unknown Location');
                } else {
                    setCurrentLocationString('No active location');
                }
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && recipient && locations.length > 0) {
            setName(recipient.name);
            setTitle(recipient.title);

            // Reset dropdowns
            setSelectedBuildingId('');
            setSelectedFloorId('');
            setSelectedRoomId('');

            const activeAssignment = recipient.assignments.find(a => a.status === 'assigned') || recipient.assignments[0];
            if (activeAssignment && activeAssignment.locationId) {
                const locId = (typeof activeAssignment.locationId === 'object')
                    ? (activeAssignment.locationId as any)._id
                    : activeAssignment.locationId;

                const locObj = (typeof activeAssignment.locationId === 'object') ? activeAssignment.locationId as unknown as BoxLocation : undefined;

                let str = buildLocationString(locId, locations);
                if ((!str || str === '') && locObj) {
                    str = locObj.name;
                }
                setCurrentLocationString(str || 'Unknown Location');
            } else {
                setCurrentLocationString('No active location');
            }
        }
    }, [isOpen, recipient, locations]);

    // Filter Floors when Building changes
    useEffect(() => {
        if (selectedBuildingId) {
            const children = locations.filter(l => l.parentId === selectedBuildingId && l.status !== 'Inactive');
            setFloors(children);
            setSelectedFloorId('');
            setSelectedRoomId('');
        } else {
            setFloors([]);
        }
    }, [selectedBuildingId, locations]);

    // Filter Rooms when Floor changes
    useEffect(() => {
        if (selectedFloorId) {
            // Filter inactive and potentially filter "active in room" (current active room?)
            // If "jangan tampilkan lokasi yang masih aktiv di room" means "Don't show occupied/current room":
            const activeAssignment = recipient?.assignments.find(a => a.status === 'assigned') || recipient?.assignments[0];
            const currentActiveLocationId = activeAssignment && typeof activeAssignment.locationId === 'string'
                ? activeAssignment.locationId
                : (activeAssignment?.locationId as any)?._id;

            const children = locations.filter(l =>
                l.parentId === selectedFloorId &&
                l.status !== 'Inactive' &&
                l._id !== currentActiveLocationId // Exclude the current active room
            );
            setRooms(children);
            setSelectedRoomId('');
        } else {
            setRooms([]);
        }
    }, [selectedFloorId, locations, recipient]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient) return;

        setIsLoading(true);

        try {
            await assignmentService.bulkUpdateRecipient({
                currentName: recipient.name,
                newName: name !== recipient.name ? name : undefined,
                newTitle: title !== recipient.title ? title : undefined,
                newLocationId: selectedRoomId || undefined
            });

            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: `Details updated for ${name}`,
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Update failed", error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to update recipient', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Recipient Details</h2>
                        <p className="text-sm text-slate-500">Update details for all assigned assets</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recipient Name</label>
                            <input
                                type="text"
                                required
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title / Role</label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Current Location Display */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2 border border-blue-100 dark:border-blue-900/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Active Location</span>
                        </div>
                        <div className="ml-7 text-sm font-medium text-slate-900 dark:text-white">
                            {currentLocationString}
                        </div>
                    </div>

                    {/* Location Update */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-slate-400">edit_location</span>
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Move Assets To (Optional)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Building</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                        value={selectedBuildingId}
                                        onChange={e => setSelectedBuildingId(e.target.value)}
                                    >
                                        <option value="">Keep Current</option>
                                        {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Floor</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                        value={selectedFloorId}
                                        onChange={e => setSelectedFloorId(e.target.value)}
                                        disabled={!selectedBuildingId}
                                    >
                                        <option value="">Select Floor</option>
                                        {floors.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Room/Area</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                    value={selectedRoomId}
                                    onChange={e => setSelectedRoomId(e.target.value)}
                                    disabled={!selectedFloorId}
                                >
                                    <option value="">Select Room</option>
                                    {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
