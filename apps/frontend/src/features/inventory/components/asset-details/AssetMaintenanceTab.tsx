import { useState } from 'react';
import { Asset } from '@/services/assetService';
import { MaintenanceDetailModal } from '@/features/maintenance/components/MaintenanceDetailModal';

interface AssetMaintenanceTabProps {
    asset: Asset | null;
}

export function AssetMaintenanceTab({ asset }: AssetMaintenanceTabProps) {
    const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>(undefined);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    if (!asset) return null;

    const maintenanceHistory = asset.maintenanceHistory || [];

    const handleViewTicket = (ticketId: string | undefined) => {
        if (!ticketId) return;
        setSelectedTicketId(ticketId);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance History</h3>
                <div className="text-sm text-slate-500">
                    Total Records: {maintenanceHistory.length}
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Ticket #</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Cost</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {maintenanceHistory.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No maintenance history recorded.
                                </td>
                            </tr>
                        ) : (
                            maintenanceHistory.map((record: any, index: number) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                        {record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                                        {record.ticketNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="line-clamp-2 text-slate-900 dark:text-white">
                                            {record.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                                        ${record.cost || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {record.ticketId ? (
                                            <button
                                                onClick={() => handleViewTicket(record.ticketId)}
                                                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                            >
                                                View Details
                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            </button>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Legacy Record</span>
                                        )}
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
