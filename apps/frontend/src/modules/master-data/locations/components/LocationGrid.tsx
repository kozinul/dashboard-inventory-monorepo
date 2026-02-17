import { MapPinIcon, EllipsisVerticalIcon, ServerIcon } from '@heroicons/react/24/outline';
import { ArchiveBoxIcon, StopIcon, LockClosedIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { clsx } from "clsx";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { BoxLocation, CreateLocationDto, locationService } from '@/services/locationService';
import { LocationModal } from './LocationModal';
import Swal from 'sweetalert2';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface LocationCardProps {
    data: BoxLocation;
    onEdit: (location: BoxLocation) => void;
    onDelete: (location: BoxLocation) => void;
    onViewDetails: (location: BoxLocation) => void;
}

// Maps
const iconMap: Record<string, any> = {
    'Building': ArchiveBoxIcon,
    'Floor': MapPinIcon,
    'Room': StopIcon,
    'Zone': ArchiveBoxIcon,
    'Rack': ServerIcon,
    'Other': LockClosedIcon
};

const colorMap: Record<string, string> = {
    'Building': 'amber',
    'Floor': 'blue',
    'Room': 'indigo',
    'Zone': 'purple',
    'Rack': 'emerald',
    'Other': 'gray'
};

function LocationCard({ data, onEdit, onDelete, onViewDetails }: LocationCardProps) {
    const Icon = iconMap[data.type] || StopIcon;
    const color = colorMap[data.type] || 'gray';

    // Mock capacity/assets for now until backend aggregate is ready
    const capacity = (data as any).capacity || 0;
    const assets = 0; // Placeholder

    return (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 hover:border-accent-indigo/50 transition-all group h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("size-12 rounded-xl flex items-center justify-center", `bg-${color}-500/10 text-${color}-500`)}>
                    <Icon className={clsx("size-7", `text-${color}-500`)} />
                </div>

                <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-white/5">
                        <EllipsisVerticalIcon className="size-6" />
                    </Menu.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-surface-dark border border-border-dark shadow-xl focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => onEdit(data)}
                                            className={clsx(
                                                active ? 'bg-white/5 text-white' : 'text-text-secondary',
                                                'group flex w-full items-center px-4 py-2 text-sm gap-2'
                                            )}
                                        >
                                            <PencilIcon className="size-4" />
                                            Edit
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => onDelete(data)}
                                            className={clsx(
                                                active ? 'bg-rose-500/10 text-rose-500' : 'text-rose-500',
                                                'group flex w-full items-center px-4 py-2 text-sm gap-2'
                                            )}
                                        >
                                            <TrashIcon className="size-4" />
                                            Delete
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>

            <div className="mb-6 flex-1">
                <h3 className="text-lg font-bold text-white mb-1 truncate" title={data.name}>{data.name}</h3>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                    <MapPinIcon className="size-3.5" />
                    {data.description || data.type}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-text-secondary">Capacity</span>
                        <span className="text-white font-medium">
                            {capacity > 0 ? (data.type === 'Rack' ? `${capacity}U` : `${capacity} Slots`) : (data.type === 'Rack' || data.type === 'Panel' || data.type === 'Panel Box') ? (data.type === 'Rack' ? '0U' : '0 Slots') : 'N/A'}
                        </span>
                    </div>
                    {/* Capacity bar */}
                    <div className="h-2 w-full bg-background-dark rounded-full overflow-hidden">
                        <div
                            className={clsx("h-full rounded-full", `bg-${color}-500`)}
                            style={{ width: `${Math.min(capacity, 100)}%` }} // Visual mock
                        ></div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border-dark/50">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Assets</span>
                        <span className="text-lg font-header font-bold text-white">{assets}</span>
                    </div>
                    <button
                        onClick={() => onViewDetails(data)}
                        className="px-3 py-1.5 text-xs font-semibold text-accent-indigo hover:bg-accent-indigo/10 rounded-md transition-colors"
                    >
                        View Contents
                    </button>
                </div>
            </div>
        </div>
    );
}

export function LocationGrid({ parentLocation, viewMode = 'grid', onViewDetails }: { parentLocation: BoxLocation | null, viewMode?: 'grid' | 'list', onViewDetails: (location: BoxLocation) => void }) {
    // ... state ...
    const [locations, setLocations] = useState<BoxLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<BoxLocation | null>(null);

    const parentId = parentLocation ? parentLocation._id : null;

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const data = await locationService.getAll();
            setLocations(data);
        } catch (error) {
            console.error("Failed to load locations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
        window.addEventListener('location-update', fetchLocations);
        return () => window.removeEventListener('location-update', fetchLocations);
    }, []);

    const { activeBranchId } = useAppStore();

    const filteredLocations = locations
        .filter(l => activeBranchId === 'ALL' || l.branchId === activeBranchId)
        .filter(l => l.parentId === parentId);

    const handleCreate = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    const handleEdit = (location: BoxLocation) => {
        setEditingLocation(location);
        setIsModalOpen(true);
    };

    const handleDelete = async (location: BoxLocation) => {
        const result = await Swal.fire({
            title: 'Delete Location?',
            text: `This will remove ${location.name}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Delete',
            background: '#1A1A2E',
            color: '#ffffff'
        });

        if (result.isConfirmed) {
            try {
                await locationService.delete(location._id);
                window.dispatchEvent(new Event('location-update'));
                await fetchLocations();
                Swal.fire({
                    title: 'Deleted!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1A1A2E',
                    color: '#ffffff'
                });
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Could not delete location.',
                    icon: 'error',
                    background: '#1A1A2E',
                    color: '#ffffff'
                });
            }
        }
    };

    const handleSave = async (data: CreateLocationDto) => {
        try {
            if (editingLocation) {
                await locationService.update(editingLocation._id, data);
            } else {
                await locationService.create({
                    ...data,
                    parentId: parentId
                });
            }
            window.dispatchEvent(new Event('location-update'));
            await fetchLocations();
        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error', text: 'Failed to save', icon: 'error', background: '#1A1A2E', color: '#ffffff' });
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading locations...</div>;

    if (viewMode === 'list') {
        return (
            <>
                <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-border-dark">
                        <thead className="bg-surface-dark/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider sm:pl-6">Name</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Capacity</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark bg-surface-dark">
                            {filteredLocations.map((loc) => (
                                <tr key={loc._id} className="hover:bg-white/5 transition-colors">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const Icon = iconMap[loc.type] || StopIcon;
                                                const color = colorMap[loc.type] || 'gray';
                                                return <Icon className={clsx("h-5 w-5", `text-${color}-500`)} />;
                                            })()}
                                            {loc.name}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">{loc.type}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                                        {(loc as any).capacity ? (loc.type === 'Rack' ? `${(loc as any).capacity}U` : `${(loc as any).capacity} Slots`) : (loc.type === 'Rack' || loc.type === 'Panel' || loc.type === 'Panel Box') ? (loc.type === 'Rack' ? '0U' : '0 Slots') : 'N/A'}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(loc)} className="text-text-secondary hover:text-white transition-colors">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(loc)} className="text-text-secondary hover:text-rose-500 transition-colors">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={4} className="py-3 px-6 text-center border-t border-border-dark border-dashed hover:bg-white/5 cursor-pointer" onClick={handleCreate}>
                                    <div className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-accent-indigo transition-colors font-medium">
                                        <div className="size-6 rounded-full border border-current flex items-center justify-center text-lg leading-none pb-0.5">+</div>
                                        Add New Location
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <LocationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSave}
                    editingLocation={editingLocation}
                    parentLocation={parentLocation}
                />
            </>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLocations.map((loc) => (
                    <LocationCard
                        key={loc._id}
                        data={loc}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewDetails={onViewDetails}
                    />
                ))}

                {/* Create New Card */}
                <div
                    onClick={handleCreate}
                    className="border-2 border-dashed border-border-dark rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-surface-dark/50 hover:border-accent-indigo/40 transition-all cursor-pointer group h-full min-h-[240px]"
                >
                    <div className="size-12 rounded-full bg-surface-dark flex items-center justify-center text-text-secondary group-hover:text-accent-indigo transition-colors">
                        <span className="text-[32px] leading-none">+</span>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-white">Create New Location</p>
                        <p className="text-xs text-text-secondary">Add room, rack, or storage unit</p>
                    </div>
                </div>
            </div>

            <LocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                editingLocation={editingLocation}
                parentLocation={parentLocation}
            />
        </>
    );
}
