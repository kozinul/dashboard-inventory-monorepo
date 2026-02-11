import { useState, useEffect } from 'react';
import { transferService, Transfer } from '../../services/transferService';
import { TransferModal } from '../../features/transfer/components/TransferModal';
import { showSuccessToast, showErrorToast, showConfirmDelete } from '../../utils/swal';
import { useAuthStore } from '../../store/authStore';
import { AssetStatusBadge } from '../../features/inventory/components/AssetTableParts';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function TransferPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
    const { user } = useAuthStore();

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
            showSuccessToast('Transfer approved!');
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

    const incomingPending = transfers.filter(t =>
        t.status === 'Pending' &&
        (t.toDepartmentId?._id === user?.departmentId || t.toDepartmentId === user?.departmentId)
    );

    const outgoingPending = transfers.filter(t =>
        t.status === 'Pending' &&
        (
            (t.fromDepartmentId?._id === user?.departmentId || t.fromDepartmentId === user?.departmentId) ||
            (t.requestedBy?._id === user?._id || t.requestedBy === user?._id)
        )
    );

    const history = transfers.filter(t => t.status !== 'Pending');

    const displayedTransfers = activeTab === 'incoming'
        ? incomingPending
        : activeTab === 'outgoing'
            ? outgoingPending
            : history;

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
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex gap-8">
                    {[
                        { id: 'incoming', label: 'Incoming Requests', count: incomingPending.length },
                        { id: 'outgoing', label: 'Outgoing Requests', count: outgoingPending.length },
                        { id: 'history', label: 'Transfer History', count: null }
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
                                    {activeTab === 'incoming' && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>}
                                    {activeTab === 'outgoing' && <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>}
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
                                                transfer.status === 'Pending' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                                                transfer.status === 'Approved' && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
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
                                        {activeTab === 'incoming' && (
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
                                                        onClick={() => handleApprove(transfer._id)}
                                                        className="size-8 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-all shadow-lg shadow-green-500/20"
                                                        title="Approve"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === 'outgoing' && transfer.status === 'Pending' && (
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
                                                        title="Cancel Transfer"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === 'outgoing' && transfer.status !== 'Pending' && (
                                            <td className="px-6 py-4 text-right"></td>
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
