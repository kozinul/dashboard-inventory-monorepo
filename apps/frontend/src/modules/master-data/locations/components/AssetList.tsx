import { useState, useEffect } from 'react';
import { Asset, assetService } from '@/services/assetService';
import { ComputerDesktopIcon, ServerIcon, CubeIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';


import { formatIDR } from '@/utils/currency';

interface AssetListProps {
    locationId: string;
    locationName: string;
}

function AssetRow({ asset }: { asset: Asset }) {
    let Icon = CubeIcon;
    if (asset.category === 'Hardware') Icon = ComputerDesktopIcon;
    if (asset.category === 'Server') Icon = ServerIcon;

    return (
        <tr className="hover:bg-surface-dark transition-colors group">
            <td className="py-3 pl-4 pr-3 text-sm sm:pl-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-surface-dark border border-border-dark flex items-center justify-center text-text-secondary group-hover:border-accent-indigo/50 group-hover:text-accent-indigo transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-white">{asset.name}</div>
                        <div className="text-xs text-text-secondary">{asset.model}</div>
                    </div>
                </div>
            </td>
            <td className="px-3 py-3 text-sm text-text-secondary font-mono text-xs">{asset.serial}</td>
            <td className="px-3 py-3 text-sm">
                <span className={clsx("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", {
                    'bg-green-500/10 text-green-400 ring-green-500/20': asset.status === 'active',
                    'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20': asset.status === 'maintenance',
                    'bg-gray-500/10 text-gray-400 ring-gray-500/20': asset.status === 'storage' || asset.status === 'retired',
                })}>
                    {asset.status}
                </span>
            </td>
            <td className="px-3 py-3 text-sm text-text-secondary text-right">{formatIDR(asset.value)}</td>
        </tr>
    );
}

export function AssetList({ locationId, locationName }: AssetListProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const response = await assetService.getAll({ locationId, limit: 100 });
                setAssets(response.data);
            } catch (error) {
                console.error("Failed to fetch assets", error);
            } finally {
                setLoading(false);
            }
        };

        if (locationId) {
            fetchAssets();
        }
    }, [locationId]);

    if (loading) return <div className="text-center py-10 text-text-secondary">Loading assets for {locationName}...</div>;

    if (assets.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-border-dark rounded-xl">
                <CubeIcon className="mx-auto h-12 w-12 text-text-secondary" />
                <h3 className="mt-2 text-sm font-semibold text-white">No assets found</h3>
                <p className="mt-1 text-sm text-text-secondary">There are no assets assigned to {locationName}.</p>
                <div className="mt-6">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-accent-indigo px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add Asset
                    </button>
                    {/* Placeholder for PlusIcon since it's not imported yet */}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-border-dark flex justify-between items-center">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-white">Assets in {locationName}</h3>
                    <p className="mt-1 text-sm text-text-secondary">Inventory items located here.</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/30">
                    {assets.length} items
                </span>
            </div>
            <div className="px-4 py-5 sm:p-0">
                <table className="min-w-full divide-y divide-border-dark">
                    <thead>
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider sm:pl-6">Item</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Serial</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {assets.map((asset) => (
                            <AssetRow key={asset._id} asset={asset} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { PlusIcon } from '@heroicons/react/20/solid'; // Importing here to fix the usage above
