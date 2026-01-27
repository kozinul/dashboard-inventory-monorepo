import { ChevronDownIcon, ChevronRightIcon, HomeIcon, BuildingOfficeIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { BoxLocation, CreateLocationDto, locationService } from '@/services/locationService';
import { LocationModal } from './LocationModal';
import { clsx } from "clsx";
import Swal from 'sweetalert2';

interface LocationNodeProps {
    location: BoxLocation;
    childrenLocations: BoxLocation[];
    allLocations: BoxLocation[];
    level: number;
    selectedId?: string;
    onSelect?: (location: BoxLocation) => void;
    onAdd: (parent: BoxLocation) => void;
    onEdit: (location: BoxLocation) => void;
    onDelete: (location: BoxLocation) => void;
}

function LocationNode({ location, childrenLocations, allLocations, level, selectedId, onSelect, onAdd, onEdit, onDelete }: LocationNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level < 1); // Expand top levels by default
    const hasChildren = childrenLocations.length > 0;
    const isSelected = selectedId === location._id;

    // Recursive render helper
    const getChildNodes = (parentId: string) => {
        return allLocations.filter(l => l.parentId === parentId);
    };

    return (
        <div className="w-full select-none">
            <div
                className={clsx(
                    "group relative flex items-center gap-2 px-2 py-1.5 rounded-md w-full cursor-pointer transition-colors",
                    isSelected ? "bg-accent-indigo text-white" : "hover:bg-surface-dark",
                    !isSelected && level === 0 ? "text-white font-medium text-sm" : !isSelected && "text-sm text-text-secondary hover:text-white"
                )}
                onClick={() => onSelect?.(location)}
            >

                {/* Indentation lines for deeper levels */}
                {level > 0 && (
                    <div className={clsx("absolute left-[calc(-8px)] top-1/2 -translate-y-1/2 w-2 h-[1px]", isSelected ? "bg-indigo-300" : "bg-border-dark")}></div>
                )}

                {/* Icon based on Type */}
                {location.type === 'Building' || location.type === 'Floor' ? (
                    <BuildingOfficeIcon className="h-[18px] w-[18px] shrink-0" />
                ) : (
                    <HomeIcon className="h-[18px] w-[18px] shrink-0" />
                )}

                {/* Content */}
                <div className="flex-1 text-left truncate flex items-center gap-2">
                    {location.name}
                </div>

                {/* Actions (visible on hover) */}
                <div className={clsx("opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto", isSelected ? "bg-accent-indigo" : "bg-surface-dark/90")}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(location); }}
                        className={clsx("p-1 rounded", isSelected ? "text-white hover:bg-white/20" : "text-text-secondary hover:text-accent-indigo hover:bg-white/5")}
                        title="Add Child"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(location); }}
                        className={clsx("p-1 rounded", isSelected ? "text-white hover:bg-white/20" : "text-text-secondary hover:text-white hover:bg-white/5")}
                        title="Edit"
                    >
                        <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(location); }}
                        className={clsx("p-1 rounded", isSelected ? "text-white hover:bg-white/20" : "text-text-secondary hover:text-rose-500 hover:bg-white/5")}
                        title="Delete"
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Expand/Collapse Toggle */}
                {hasChildren && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={clsx("p-0.5 ml-1", isSelected ? "text-white" : "text-text-secondary hover:text-white")}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="h-[14px] w-[14px]" />
                        ) : (
                            <ChevronRightIcon className="h-[14px] w-[14px]" />
                        )}
                    </button>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div className={clsx("flex flex-col gap-1 relative", level === 0 ? "ml-4 mt-1 pl-2 border-l border-border-dark" : "ml-4 pt-1 pl-2 border-l border-border-dark")}>
                    {childrenLocations.map(child => (
                        <LocationNode
                            key={child._id}
                            location={child}
                            childrenLocations={getChildNodes(child._id)}
                            allLocations={allLocations}
                            level={level + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAdd={onAdd}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export interface LocationHierarchyProps {
    selectedId?: string;
    onSelect?: (location: BoxLocation | null) => void;
}

export function LocationHierarchy({ selectedId, onSelect }: LocationHierarchyProps) {
    const [locations, setLocations] = useState<BoxLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Modal State
    const [editingLocation, setEditingLocation] = useState<BoxLocation | null>(null);
    const [parentLocation, setParentLocation] = useState<BoxLocation | null>(null);

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

    const handleAddRoot = () => {
        setEditingLocation(null);
        setParentLocation(null);
        setIsModalOpen(true);
    };

    const handleAddChild = (parent: BoxLocation) => {
        setEditingLocation(null);
        setParentLocation(parent);
        setIsModalOpen(true);
    };

    const handleEdit = (location: BoxLocation) => {
        setEditingLocation(location);
        setParentLocation(locations.find(l => l._id === location.parentId) || null);
        setIsModalOpen(true);
    };

    const handleDelete = async (location: BoxLocation) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete ${location.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444', // red-500
            cancelButtonColor: '#6B7280', // gray-500
            confirmButtonText: 'Yes, delete it',
            background: '#1A1A2E', // surface-dark
            color: '#ffffff'
        });

        if (!result.isConfirmed) return;

        try {
            await locationService.delete(location._id);
            window.dispatchEvent(new Event('location-update'));
            await fetchLocations();
            Swal.fire({
                title: 'Deleted!',
                text: 'Location has been deleted.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#1A1A2E',
                color: '#ffffff'
            });
        } catch (error) {
            console.error("Failed to delete", error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to delete. Ensure it has no children.',
                icon: 'error',
                background: '#1A1A2E',
                color: '#ffffff'
            });
        }
    };

    const handleSave = async (data: CreateLocationDto) => {
        try {
            if (editingLocation) {
                await locationService.update(editingLocation._id, data);
            } else {
                await locationService.create({
                    ...data,
                    parentId: parentLocation ? parentLocation._id : null
                });
            }
            window.dispatchEvent(new Event('location-update'));
            await fetchLocations();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to save location',
                icon: 'error',
                background: '#1A1A2E',
                color: '#ffffff'
            });
        }
    };

    // Get root nodes
    const rootNodes = locations.filter(l => !l.parentId);
    const getChildren = (parentId: string) => locations.filter(l => l.parentId === parentId);

    if (loading) return <div className="text-sm text-text-secondary animate-pulse">Loading hierarchy...</div>;

    return (
        <div className="flex flex-col gap-1 w-full pb-10">
            <div className="mb-2">
                <button
                    onClick={handleAddRoot}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-surface-dark border border-dashed border-border-dark rounded-md hover:bg-surface-dark/80 hover:border-accent-indigo transition-colors"
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add Root Location
                </button>
            </div>

            {locations.length === 0 && (
                <div className="text-xs text-text-secondary text-center py-4 italic">
                    No locations found. Add one to start.
                </div>
            )}

            {rootNodes.map(node => (
                <LocationNode
                    key={node._id}
                    location={node}
                    childrenLocations={getChildren(node._id)}
                    allLocations={locations}
                    level={0}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ))}

            <LocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                editingLocation={editingLocation}
                parentLocation={parentLocation}
            />
        </div>
    );
}
