import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { LocationHierarchy } from './components/LocationHierarchy';
import { LocationGrid } from './components/LocationGrid';
import { LocationStats } from './components/LocationStats';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { BoxLocation, locationService, CreateLocationDto } from '@/services/locationService';
import { clsx } from 'clsx';
import { LocationDetail } from './components/LocationDetail';
import { LocationModal } from './components/LocationModal';

export function LocationsPage() {
    const [selectedLocation, setSelectedLocation] = useState<BoxLocation | null>(null);
    const [viewMode, setViewMode] = useState<'locations' | 'assets'>('locations');
    const [detailLocation, setDetailLocation] = useState<BoxLocation | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // If detail view is active, render only that
    if (detailLocation) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] -m-10 p-6 bg-background-dark text-white font-display overflow-hidden">
                <LocationDetail
                    location={detailLocation}
                    onBack={() => setDetailLocation(null)}
                    onSelectLocation={setDetailLocation}
                />
            </div>
        );
    }

    const handleCreateLocation = async (data: CreateLocationDto) => {
        try {
            await locationService.create(data);
            // In a real app we should refetch or update local state.
            // Since we don't have direct access to LocationGrid's refresh method or global state here easily without context/query client invalidation,
            // we might want to force a refresh or just rely on user navigation.
            // However, since we are using React Query (as seen in App.tsx), we could invalidate queries.
            // For now, let's just close the modal and maybe reload the page or assume components will refetch if keys change.
            // Better: trigger a re-render or refetch if we had access to it.
            window.location.reload(); // Simple brute force for now to ensure data visibility
        } catch (error) {
            console.error('Failed to create location', error);
            alert('Failed to create location');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] -m-10 bg-background-dark text-white font-display overflow-hidden">
            {/* Header - Custom for this page to match design */}
            <header className="h-16 bg-background-dark border-b border-border-dark px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 w-96">
                    <div className="relative w-full group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-indigo transition-colors">
                            <MagnifyingGlassIcon className="size-5" />
                        </span>
                        <input
                            className="w-full bg-surface-dark border-none rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-text-secondary focus:ring-1 focus:ring-accent-indigo focus:outline-none h-10 transition-all"
                            placeholder="Search locations, buildings, or racks..."
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-10 px-4 bg-surface-dark text-white text-sm font-medium rounded-lg border border-border-dark hover:bg-[#252540] transition-colors flex items-center gap-2">
                        <FunnelIcon className="size-5" />
                        Filters
                    </button>
                    <div className="h-6 w-px bg-border-dark mx-1"></div>
                    <Link to="/master-data/locations/types" className="h-10 px-4 bg-surface-dark text-white text-sm font-medium rounded-lg border border-border-dark hover:bg-[#252540] transition-colors flex items-center gap-2">
                        Manage Types
                    </Link>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-10 px-4 bg-accent-indigo text-white text-sm font-bold rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <PlusIcon className="size-5" />
                        Add Location
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-background-dark border-r border-border-dark overflow-y-auto p-6 hidden lg:flex flex-col gap-6">
                    <div>
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Location Hierarchy</h3>
                        <LocationHierarchy
                            selectedId={selectedLocation?._id}
                            onSelect={setSelectedLocation}
                        />
                    </div>
                    {/* ... filters ... */}
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                        {/* Breadcrumbs & Title */}
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-2">
                                    <span
                                        onClick={() => setSelectedLocation(null)}
                                        className="hover:text-white cursor-pointer"
                                    >
                                        Root
                                    </span>
                                    {selectedLocation && (
                                        <>
                                            <ChevronRightIcon className="size-3" />
                                            <span className="text-accent-indigo">{selectedLocation.name}</span>
                                        </>
                                    )}
                                </div>
                                <h2 className="font-header text-3xl font-bold text-white mb-1">
                                    {selectedLocation ? selectedLocation.name : 'All Locations'}
                                </h2>
                                <p className="text-text-secondary text-sm">
                                    {selectedLocation
                                        ? `Managing contents of ${selectedLocation.name}`
                                        : 'Overview of all location assets'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex bg-surface-dark p-1 rounded-lg border border-border-dark">
                                    <button
                                        onClick={() => setViewMode('locations')}
                                        className={clsx("p-1.5 rounded-md shadow-sm transition-colors", viewMode === 'locations' ? "bg-accent-indigo text-white" : "text-text-secondary hover:text-white")}
                                        title="Sub-Locations"
                                    >
                                        <Squares2X2Icon className="size-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('assets')}
                                        className={clsx("p-1.5 rounded-md shadow-sm transition-colors", viewMode === 'assets' ? "bg-accent-indigo text-white" : "text-text-secondary hover:text-white")}
                                        title="Assets"
                                    >
                                        <ListBulletIcon className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Switcher */}
                        <LocationGrid
                            parentId={selectedLocation?._id || null}
                            viewMode={viewMode === 'assets' ? 'list' : 'grid'} // Map 'assets' icon to 'list' view of locations
                            onViewDetails={setDetailLocation}
                        />

                        {/* Stats */}
                        <LocationStats />
                    </div>
                </main>
            </div>

            <LocationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateLocation}
                parentLocation={selectedLocation}
            />
        </div>
    );
}
