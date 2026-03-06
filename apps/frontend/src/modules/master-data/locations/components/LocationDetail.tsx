import { BoxLocation, locationService, CreateLocationDto } from '@/services/locationService';
import { Asset, assetService } from '@/services/assetService';
import { useState, useEffect } from 'react';
import {
    ServerIcon,
    CheckCircleIcon,
    BoltIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    Squares2X2Icon,
    PencilIcon,
} from '@heroicons/react/24/outline';
import { CubeIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { LocationGrid } from './LocationGrid';
import { LocationModal } from './LocationModal';
import Swal from 'sweetalert2';
// Note: Heroicons doesn't have thermostat/humidity exactly like Material. Using approximations.

interface LocationDetailProps {
    location: BoxLocation;
    onBack: () => void;
    onSelectLocation?: (location: BoxLocation) => void;
}

export function LocationDetail({ location, onBack, onSelectLocation }: LocationDetailProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await assetService.getAll({ locationId: location._id });
                setAssets(response.data);
            } catch (error) {
                console.error("Failed to load assets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, [location._id]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleSave = async (data: CreateLocationDto) => {
        try {
            await locationService.update(location._id, data);
            window.dispatchEvent(new Event('location-update'));
            setIsEditModalOpen(false);
            Swal.fire({
                title: 'Updated!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: '#1A1A2E',
                color: '#ffffff'
            });
            // Update the local prop if possible, or wait for parent to re-render
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'Failed to save', icon: 'error', background: '#1A1A2E', color: '#ffffff' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white font-display overflow-hidden rounded-xl border border-border-dark">
            {/* Header / Top Bar of the Detail View */}
            <div className="bg-surface-dark/50 border-b border-border-dark px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <button onClick={onBack} className="text-text-secondary hover:text-white flex items-center gap-1 text-xs">
                                <ChevronLeftIcon className="size-3" />
                                Back
                            </button>
                            <button onClick={() => setIsEditModalOpen(true)} className="text-text-secondary hover:text-white p-1 ml-4 rounded hover:bg-white/5 transition-colors" title="Edit Location">
                                <PencilIcon className="size-4" />
                            </button>
                        </div>
                        <h2 className="font-header text-2xl font-bold text-white">{location.name}</h2>
                        <p className="text-xs font-mono text-text-secondary">{location.type.toUpperCase()}-{location._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="h-8 w-px bg-border-dark"></div>
                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Description</span>
                            <span className="text-sm text-white truncate max-w-[150px]">{location.description || 'N/A'}</span>
                        </div>
                        {(location.type === 'Rack' || location.type === 'Panel' || location.type === 'Panel Box') && (
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Capacity</span>
                                <span className="text-sm font-mono text-white">{location.capacity || 0}{location.type === 'Rack' ? 'U' : ' Slots'}</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Dept Owner</span>
                            <span className="text-sm font-medium text-white">{typeof location.departmentId === 'object' && location.departmentId !== null ? location.departmentId.name : (location.departmentId || 'Unassigned')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Status</span>
                            <span className={clsx("text-sm font-bold", location.status === 'Active' ? 'text-emerald-400' : location.status === 'Maintenance' ? 'text-amber-400' : 'text-rose-400')}>
                                {location.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {location.isWarehouse && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded border border-amber-500/20">Warehouse</span>}
                    <span className="px-2 py-1 bg-accent-indigo/10 text-accent-indigo text-[10px] font-bold uppercase rounded border border-accent-indigo/20">{location.type}</span>
                </div>
            </div>

            <LocationModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleSave}
                editingLocation={location}
                parentLocation={typeof location.parentId === 'object' ? location.parentId as any : null}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left: Sub-Locations (Racks, etc.) */}
                <div className="flex-1 overflow-y-auto p-8 border-r border-border-dark bg-background-dark/50">
                    <h3 className="font-header text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Squares2X2Icon className="size-5 text-accent-indigo" />
                        Sub-Locations & Racks
                    </h3>

                    <LocationGrid
                        parentLocation={location}
                        viewMode="grid"
                        onViewDetails={onSelectLocation || (() => { })}
                    />
                </div>

                {/* Right: Asset List Sidebar */}
                <div className="w-[420px] flex flex-col bg-background-dark overflow-hidden border-l border-border-dark shrink-0">
                    <div className="p-6 border-b border-border-dark">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-header font-bold text-white">Assets in Room ({assets.length})</h3>
                            <button className="text-accent-indigo text-xs font-bold flex items-center gap-1 hover:text-indigo-400">
                                <FunnelIcon className="size-3" />
                                Filter
                            </button>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                <MagnifyingGlassIcon className="size-4" />
                            </span>
                            <input
                                className="w-full bg-surface-dark border-border-dark rounded-lg py-1.5 pl-10 pr-4 text-sm text-white placeholder-text-secondary focus:ring-1 focus:ring-accent-indigo focus:outline-none transition-all"
                                placeholder="Quick search..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {loading ? (
                            <div className="text-center text-text-secondary text-sm py-4">Loading assets...</div>
                        ) : assets.length === 0 ? (
                            <div className="text-center text-text-secondary text-sm py-4">No assets found.</div>
                        ) : (
                            assets.map((asset) => (
                                <AssetCard key={asset._id} asset={asset} />
                            ))
                        )}
                    </div>

                    {/* Pagination / Footer */}
                    <div className="p-4 border-t border-border-dark bg-surface-dark/30 flex items-center justify-between shrink-0">
                        <span className="text-[10px] text-text-secondary">Showing 1-{Math.min(10, assets.length)} of {assets.length}</span>
                        <div className="flex gap-1">
                            <button className="size-7 flex items-center justify-center rounded border border-border-dark text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                                <ChevronLeftIcon className="size-4" />
                            </button>
                            <button className="size-7 flex items-center justify-center rounded border border-border-dark text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                                <ChevronRightIcon className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AssetCard({ asset }: { asset: Asset }) {
    // Determine icon and colors based on type/status
    let Icon = CubeIcon;
    if (asset.category === 'Server' || asset.name.toLowerCase().includes('server')) Icon = ServerIcon;
    if (asset.name.toLowerCase().includes('router') || asset.name.toLowerCase().includes('switch')) Icon = CheckCircleIcon; // Mock
    if (asset.name.toLowerCase().includes('ups')) Icon = BoltIcon;

    const isWarn = asset.status === 'maintenance' || asset.status === 'retired';
    const statusColor = asset.status === 'active' ? 'emerald' : 'amber'; // simplified
    const borderColor = isWarn ? 'border-amber-500' : 'border-border-dark';
    const hoverBorder = isWarn ? 'hover:border-amber-500/50' : 'hover:border-accent-indigo/50';

    return (
        <div className={clsx(
            "p-3 bg-surface-dark rounded-xl border transition-all cursor-pointer group",
            isWarn ? "border-l-4 border-l-amber-500" : "",
            borderColor,
            hoverBorder
        )}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "size-9 rounded-lg flex items-center justify-center",
                        `bg-${statusColor}-500/20 text-${statusColor}-500`
                    )}>
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <h4 className={clsx("text-sm font-bold text-white transition-colors", `group-hover:text-${statusColor}-500`)}>
                            {asset.name}
                        </h4>
                        <p className="text-[11px] font-mono text-text-secondary">SN: {asset.serial}</p>
                    </div>
                </div>
                <span className={clsx(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                    `bg-${statusColor}-500/10 text-${statusColor}-500`
                )}>
                    {asset.status === 'active' ? 'ONLINE' : asset.status.toUpperCase()}
                </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Loc: <span className="text-white font-mono">{asset.locationId ? 'Rack-01' : 'Unassigned'}</span></span>
                <span className={isWarn ? "text-amber-500 font-medium" : "text-text-secondary"}>
                    {isWarn ? 'Attention Needed' : 'Healthy'}
                </span>
            </div>
        </div>
    );
}
