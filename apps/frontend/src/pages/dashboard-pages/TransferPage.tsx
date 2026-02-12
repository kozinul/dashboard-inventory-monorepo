import { useState, useEffect } from 'react';
import { transferService, Transfer } from '../../services/transferService';
import { TransferModal } from '../../features/transfer/components/TransferModal';
import { showSuccessToast, showErrorToast, showConfirmDelete } from '../../utils/swal';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function TransferPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
    const [activeTab, setActiveTab] = useState<'drafts' | 'approval' | 'incoming' | 'history'>('drafts');
    const { user } = useAuthStore();
    const { activeBranchId } = useAppStore();

    // Permission check
    const hasCreatePermission = user?.permissions?.find(p => p.resource === 'transfer')?.actions.create || false;
    const canCreateTransfer = ['superuser', 'admin', 'manager', 'technician'].includes(user?.role || '') || hasCreatePermission;

    const fetchTransfers = async () => {
        setIsLoading(true);
        try {
            const data = await transferService.getAll();
            setTransfers(data);
        } catch (error) {
            console.error("Failed to fetch transfers", error);
            showErrorToast('Failed to load transfer history.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await transferService.approve(id);
            showSuccessToast('Transfer transfer received and completed!');
            fetchTransfers();
        } catch (error) {
            showErrorToast('Failed to complete transfer.');
        }
    };

    const handleSend = async (id: string) => {
        try {
            await transferService.send(id);
            showSuccessToast('Transfer sent for approval!');
            fetchTransfers();
        } catch (error) {
            showErrorToast('Failed to send transfer.');
        }
    };

    const handleManagerApprove = async (id: string) => {
        try {
            await transferService.approveManager(id);
            showSuccessToast('Transfer approved and sent to destination!');
            fetchTransfers();
        } catch (error) {
            showErrorToast('Failed to approve transfer.');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await transferService.reject(id);
            showSuccessToast('Transfer rejected.');
            fetchTransfers();
        } catch (error) {
            showErrorToast('Failed to reject transfer.');
        }
    };

    // ... inside component


    // ... inside component

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirmDelete(
            'Delete Transfer Request',
            'Are you sure you want to delete this request?'
        );

        if (!confirmed) return;

        try {
            await transferService.delete(id);
            showSuccessToast('Transfer request deleted.');
            fetchTransfers();
        } catch (error) {
            showErrorToast('Failed to delete transfer.');
        }
    };

    // 1. Drafts (Pending) - Shows for Requester
    const isSuperUser = user?.role === 'superuser';
    const drafts = transfers.filter(t =>
        t.status === 'Pending' &&
        (isSuperUser || t.requestedBy?._id === user?._id || t.requestedBy === user?._id)
    );

    // 2. Approval (WaitingApproval) - Shows for Manager of SENDER
    // Only show if user is admin/manager and is part of the sending branch/dept
    const isManager = ['superuser', 'admin', 'manager'].includes(user?.role || '');
    const approvalPending = transfers.filter(t => {
        if (t.status !== 'WaitingApproval') return false;
        if (isSuperUser) return true; // Superuser sees all

        if (!isManager) return false;

        // Check if user belongs to sending unit
        const isFromMyDept = (t.fromDepartmentId?._id === user?.departmentId || t.fromDepartmentId === user?.departmentId);
        const isFromMyBranch = (t.fromBranchId?._id === user?.branchId || t.fromBranchId === user?.branchId);

        // If user has no branch (legacy), maybe just check dept? Strictly enforcing branch if present.
        if (user?.branchId) {
            return isFromMyDept && isFromMyBranch;
        }
        return isFromMyDept;
    });

    // 3. Incoming (InTransit) - Shows for Receiver
    const incoming = transfers.filter(t =>
        t.status === 'InTransit' &&
        (isSuperUser || t.toDepartmentId?._id === user?.departmentId || t.toDepartmentId === user?.departmentId)
    );

    // 4. History - Shows Completed, Rejected, Cancelled (and WaitingApproval for requester if they want to see progress)
    const history = transfers.filter(t =>
        ['Completed', 'Rejected', 'Cancelled', 'Approved'].includes(t.status) ||
        (!isSuperUser && t.status === 'WaitingApproval' && (t.requestedBy?._id === user?._id || t.requestedBy === user?._id)) ||
        (!isSuperUser && t.status === 'InTransit' && (t.requestedBy?._id === user?._id || t.requestedBy === user?._id)) // Also show InTransit to sender in history? Or maybe a separate 'Outgoing' tab?
    );

    // Global Branch Filter for Superuser
    // If activeBranchId is not 'ALL' and user is superuser, filter the results
    const filterByBranch = (list: Transfer[]) => {
        if (!isSuperUser || activeBranchId === 'ALL') return list;
        return list.filter(t =>
            (t.fromBranchId?._id === activeBranchId || t.fromBranchId === activeBranchId) ||
            (t.toBranchId?._id === activeBranchId || t.toBranchId === activeBranchId)
        );
    };

    const displayedTransfers = activeTab === 'drafts'
        ? filterByBranch(drafts)
        : activeTab === 'approval'
            ? filterByBranch(approvalPending)
            : activeTab === 'incoming'
                ? filterByBranch(incoming)
                : filterByBranch(history);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Asset Transfers</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">move_item</span>
                        Manage equipment movement between departments
                    </p>
                </div>
                {canCreateTransfer && (
                    <button
                        onClick={() => {
                            setEditingTransfer(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Transfer Request
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex gap-8">
                    {[
                        { id: 'drafts', label: 'Drafts', count: drafts.length },
                        { id: 'approval', label: 'To Approve', count: approvalPending.length },
                        { id: 'incoming', label: 'Incoming', count: incoming.length },
                        { id: 'history', label: 'History', count: null }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "pb-4 text-sm font-bold transition-all relative",
                                activeTab === tab.id
                                    ? "text-primary"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {tab.label}
                                {tab.count !== null && tab.count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]">
                                        {tab.count}
                                    </span>
                                )}
                            </div>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : displayedTransfers.length === 0 ? (
                <div className="w-full h-64 bg-card border border-border rounded-xl flex items-center justify-center flex-col gap-4">
                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">move_item</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No transfers found</h3>
                    <p className="text-muted-foreground text-sm">There are no {activeTab} transfers to display.</p>
                </div>
            ) : (
                <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Asset</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">From</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">To</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Requested By</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                                    {activeTab === 'drafts' && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>}
                                    {activeTab === 'approval' && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>}
                                    {activeTab === 'incoming' && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {displayedTransfers.map((transfer) => (
                                    <tr key={transfer._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <span className="material-symbols-outlined">inventory_2</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {typeof transfer.assetId === 'object' ? transfer.assetId.name : 'Unknown Asset'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                        {typeof transfer.assetId === 'object' ? transfer.assetId.serial : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {transfer.fromDepartmentId?.name || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    {transfer.fromBranchId?.code || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {transfer.toDepartmentId?.name || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    {transfer.toBranchId?.code || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {transfer.requestedBy?.name || 'User'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 italic">
                                                    "{transfer.notes || 'No notes'}"
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                transfer.status === 'Pending' && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                                                transfer.status === 'WaitingApproval' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                                                transfer.status === 'InTransit' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                                                (transfer.status === 'Approved' || transfer.status === 'Completed') && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                                                transfer.status === 'Rejected' && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {transfer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-500">
                                                {format(new Date(transfer.transferDate), 'MMM d, yyyy')}
                                            </span>
                                        </td>
                                        {activeTab === 'drafts' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTransfer(transfer);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="size-8 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-all"
                                                        title="Edit Request"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(transfer._id)}
                                                        className="size-8 rounded-lg border border-slate-200 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                                                        title="Delete Draft"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSend(transfer._id)}
                                                        className="px-3 py-1 bg-primary text-background-dark rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm"
                                                        title="Send for Approval"
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {activeTab === 'approval' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(transfer._id)}
                                                        className="size-8 rounded-lg border border-slate-200 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                                                        title="Reject"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleManagerApprove(transfer._id)}
                                                        className="size-8 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-all shadow-lg shadow-green-500/20"
                                                        title="Approve & Send"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {activeTab === 'incoming' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Receiver can technically reject if they don't want it? Keep it for now */}
                                                    {/* Actually, maybe they shouldn't reject "InTransit" easily without reason? */}
                                                    {/* Keeping Reject for consistency, assuming it cancels the transfer */}
                                                    <button
                                                        onClick={() => handleReject(transfer._id)}
                                                        className="size-8 rounded-lg border border-slate-200 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                                                        title="Reject"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(transfer._id)}
                                                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                                                        title="Receive Asset"
                                                    >
                                                        Receive
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TransferModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTransfers}
                editingTransfer={editingTransfer}
            />
        </div>
    );
}
