import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { ServerIcon } from '@heroicons/react/24/outline';

interface LocationPanel {
    _id: string;
    name: string;
    type: string;
    capacity: number;
    usedCapacity?: number;
    parentId?: { name: string };
    status: string;
    departmentId?: { name: string };
}

export default function PanelListPage() {
    const [panels, setPanels] = useState<LocationPanel[]>([]);
    const [allLocations, setAllLocations] = useState<LocationPanel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPanels();
    }, []);

    const fetchPanels = async () => {
        try {
            // Fetch ALL Locations to build hierarchy paths
            const response = await axios.get('/locations');
            const data = response.data;
            setAllLocations(data);

            // Filter locally for Rack and Panel
            const filtered = data.filter((l: LocationPanel) => l.type === 'Rack' || l.type === 'Panel' || l.type === 'Panel Box');
            setPanels(filtered);
        } catch (error) {
            console.error('Failed to fetch panels', error);
        } finally {
            setLoading(false);
        }
    };

    const getLocationPath = (panel: LocationPanel) => {
        const path: string[] = [];
        let current: any = panel;

        // Traverse upwards using parentId
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel Management</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage racks, panels, and container locations</p>
                </div>
                {/* Add Panel button removed as requested */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {panels.map((panel) => (
                    <Link
                        key={panel._id}
                        to={`/inventory/panels/${panel._id}`}
                        className="block bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${panel.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                            }`} />

                        <div className="flex items-start justify-between mb-4 pl-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <ServerIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${panel.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {panel.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pl-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{panel.name}</h3>

                            <div className="flex flex-col gap-1 mb-4">
                                <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[18px] mr-1 shrink-0 mt-0.5">location_on</span>
                                    <div>
                                        <span className="font-medium mr-1">Location:</span>
                                        <span className="text-xs break-words">{getLocationPath(panel)}</span>
                                    </div>
                                </div>
                                {/* Display Department if available */}
                                {panel.departmentId?.name && (
                                    <div className="flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                                        <span className="material-symbols-outlined text-[18px] mr-1">domain</span>
                                        <span className="mr-1 font-medium">Department:</span>
                                        {panel.departmentId.name}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-600 pb-1">
                                    <span className="font-medium">Total Capacity:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{panel.capacity}{panel.type === 'Rack' ? 'U' : ' Slots'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Used:</span>
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{panel.usedCapacity || 0}{panel.type === 'Rack' ? 'U' : ' Slots'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Available:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{Math.max(0, panel.capacity - (panel.usedCapacity || 0))}{panel.type === 'Rack' ? 'U' : ' Slots'}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {panels.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                        <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No racks or panels found. Create one in Master Data &gt; Locations.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
