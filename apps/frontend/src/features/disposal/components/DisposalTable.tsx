import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { disposalService, DisposalRecord } from '../services/disposalService';
import { AssetCell, ReasonBadge, WorkflowStatusIndicator } from './DisposalTableParts';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';

export function DisposalTable() {
    const [records, setRecords] = useState<DisposalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const data = await disposalService.getRecords();
            setRecords(data);
        } catch (error) {
            console.error("Failed to fetch disposal records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleApproval = async (id: string, approved: boolean) => {
        const action = approved ? 'Approve' : 'Reject';
        const result = await showConfirmDialog(
            `${action} Request?`,
            `Are you sure you want to ${action.toLowerCase()} this disposal request?`
        );

        if (result.isConfirmed) {
            try {
                await disposalService.approveRecord(id, approved);
                showSuccessToast(`Request ${approved ? 'approved' : 'rejected'} successfully!`);
                fetchRecords(); // Refresh list
            } catch (error) {
                console.error(`Failed to ${action.toLowerCase()} record:`, error);
                showErrorToast(`Failed to ${action.toLowerCase()} record.`);
            }
        }
    };

    const canApprove = (record: DisposalRecord) => {
        if (user?.role === 'superuser' || user?.role === 'system_admin') return true;
        if (record.status === 'Pending Manager Approval' && user?.role === 'manager') return true;
        if (record.status === 'Pending Auditor Approval' && user?.role === 'auditor') return true;
        return false;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-card-dark">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Disposal Requests</h3>
                <div className="text-xs text-slate-500 font-bold">{records.length} records total</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Asset Detail</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reason</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Branch</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Workflow Details</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                        {records.map((record) => (
                            <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <AssetCell record={record} />
                                </td>
                                <td className="px-6 py-4">
                                    <ReasonBadge reason={record.reason} />
                                </td>
                                <td className="px-6 py-4">
                                    <WorkflowStatusIndicator status={record.status} />
                                </td>
                                <td className="px-6 py-4 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {record.location || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                {record.requestedBy?.name || 'Unknown'}
                                            </span>
                                            <span className="text-[9px] text-slate-400">({new Date(record.createdAt).toLocaleDateString()})</span>
                                        </div>

                                        {record.managerApproval?.approvedBy && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-emerald-500">task_alt</span>
                                                <span className="text-[9px] font-bold text-slate-500">
                                                    Mgr: {record.managerApproval.approvedBy.name}
                                                </span>
                                            </div>
                                        )}

                                        {record.auditorApproval?.approvedBy && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                                                <span className="text-[9px] font-bold text-slate-500">
                                                    Audit: {record.auditorApproval.approvedBy.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {canApprove(record) && record.status.includes('Pending') ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleApproval(record._id, true)}
                                                className="p-1 px-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded text-[10px] font-bold transition-all"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleApproval(record._id, false)}
                                                className="p-1 px-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded text-[10px] font-bold transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                            <span className="material-symbols-outlined text-lg">info</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
