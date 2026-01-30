
import { useState, useEffect } from 'react';
import { assignmentService, Assignment } from '@/services/assignmentService';

interface AssetAssignmentHistoryProps {
    assetId: string;
}

export function AssetAssignmentHistory({ assetId }: AssetAssignmentHistoryProps) {
    const [history, setHistory] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [assetId]);

    const fetchHistory = async () => {
        try {
            const data = await assignmentService.getAssetHistory(assetId);
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch assignment history", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-4">Loading history...</div>;

    return (
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
            <h3 className="px-6 py-4 font-bold border-b border-slate-200 dark:border-slate-700">Assignment History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">User</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Date Assigned</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Date Returned</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Status</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-slate-500">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No assignment history found.</td>
                            </tr>
                        ) : (
                            history.map((record) => (
                                <tr key={record._id}>
                                    <td className="px-6 py-4 font-medium">
                                        {record.userId?.name || 'Unknown User'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(record.assignedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.returnedDate ? new Date(record.returnedDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${record.status === 'assigned'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {record.notes}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
