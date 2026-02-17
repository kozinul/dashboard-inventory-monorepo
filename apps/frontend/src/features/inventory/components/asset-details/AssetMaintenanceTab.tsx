import { useState, useEffect } from 'react';
import { Asset } from '@/services/assetService';
import { maintenanceService } from '@/services/maintenanceService';
import { MaintenanceDetailModal } from '@/features/maintenance/components/MaintenanceDetailModal';
import { format } from 'date-fns';

interface AssetMaintenanceTabProps {
    asset: Asset | null;
}

export function AssetMaintenanceTab({ asset }: AssetMaintenanceTabProps) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchRecords = async () => {
        if (!asset?._id && !asset?.id) return;
        setLoading(true);
        try {
            const assetId = asset._id || asset.id;
            // Fetch all records for this asset
            const allRecords = await maintenanceService.getAll({
                asset: assetId
            });

            // Filter for Internal maintenance (Not Vendor AND Not External Service status)
            const internalRecords = Array.isArray(allRecords) ? allRecords.filter((r: any) =>
                r.serviceProviderType !== 'Vendor' && r.status !== 'External Service'
            ) : [];

            setRecords(internalRecords);
        } catch (error) {
            console.error('Failed to fetch maintenance history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [asset]);

    if (!asset) return null;

    const handleViewTicket = (ticketId: string | undefined | null) => {
        if (!ticketId) return;
        setSelectedTicketId(ticketId);
        setIsDetailOpen(true);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading maintenance history...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance History</h3>
                <div className="text-sm text-slate-500">
                    Total Records: {records.length}
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Ticket #</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Cost</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No maintenance history recorded.
                                </td>
                            </tr>
                        ) : (
                            records.map((record: any) => (
                                <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                        {record.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                                        {record.ticketNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="line-clamp-2 text-slate-900 dark:text-white" title={record.description}>
                                            {record.title}
                                            {record.description && <span className="text-slate-400"> - {record.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${['Done', 'Closed'].includes(record.status) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                            ['In Progress', 'Accepted', 'Sent'].includes(record.status) ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                                'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                            }`}>
                                            {['Done', 'Closed'].includes(record.status) ? 'Close' : record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white font-mono">
                                        {record.cost ? `Rp. ${record.cost.toLocaleString('id-ID')}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewTicket(record._id)}
                                            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                        >
                                            View Details
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <MaintenanceDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                ticketId={selectedTicketId}
            />
        </div>
    );
}
