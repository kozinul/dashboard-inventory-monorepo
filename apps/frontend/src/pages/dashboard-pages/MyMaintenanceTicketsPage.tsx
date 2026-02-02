import { useState, useEffect } from 'react';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { assignmentService } from '@/services/assignmentService';
import { assetService } from '@/services/assetService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';

const statusColors: Record<string, string> = {
    'Draft': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'Sent': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Cancelled': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400'
};

export default function MyMaintenanceTicketsPage() {
    const { user } = useAuthStore();
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [myAssets, setMyAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewTicket, setPreviewTicket] = useState<MaintenanceTicket | null>(null);
    const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);

    const isPrivileged = user?.role === 'superuser' || user?.role === 'admin';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const ticketsData = await maintenanceService.getMyTickets();
            setTickets(ticketsData);

            // Superuser/admin can access all assets, others only assigned assets
            if (isPrivileged) {
                const allAssets = await assetService.getAll();
                // Filter out assets that are under maintenance (checking both values to be safe)
                const available = (allAssets.data || []).filter((a: any) =>
                    a.status !== 'maintenance' && a.status !== 'under maintenance' && a.status !== 'request maintenance'
                );
                setMyAssets(available);
            } else {
                const assignmentsData = await assignmentService.getAll();
                const assignedAssets = assignmentsData
                    .filter((a: any) => a.status === 'assigned')
                    .map((a: any) => a.assetId)
                    .filter((a: any) =>
                        a && a.status !== 'maintenance' && a.status !== 'under maintenance' && a.status !== 'request maintenance'
                    );

                setMyAssets(assignedAssets);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showErrorToast('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelTicket = async (id: string) => {
        const result = await showConfirmDialog('Cancel Ticket?', 'This action cannot be undone.');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.cancelTicket(id);
            showSuccessToast('Ticket cancelled');
            setPreviewTicket(null);
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to cancel ticket');
        }
    };

    const handleSendTicket = async (id: string) => {
        const result = await showConfirmDialog('Send Ticket?', 'This will send the ticket to your department for processing.');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.sendTicket(id);
            showSuccessToast('Ticket sent to department!');
            setPreviewTicket(null);
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to send ticket');
        }
    };

    const handleEditDraft = (ticket: MaintenanceTicket) => {
        setEditingTicket(ticket);
        setPreviewTicket(null);
        setIsCreateModalOpen(true);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading your tickets...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Maintenance Tickets</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">confirmation_number</span>
                        Request maintenance for your assigned assets
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingTicket(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New Ticket
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-slate-500">Total</div>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-slate-600">Draft</div>
                    <div className="text-2xl font-bold text-slate-600">{tickets.filter(t => t.status === 'Draft').length}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-purple-600">Sent</div>
                    <div className="text-2xl font-bold text-purple-600">{tickets.filter(t => t.status === 'Sent').length}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-blue-600">In Progress</div>
                    <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'In Progress').length}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-green-600">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'Done').length}</div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticket #</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                    <p>No tickets yet. Create one to request maintenance.</p>
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setPreviewTicket(ticket)}>
                                    <td className="px-6 py-4 font-mono text-sm">{ticket.ticketNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.asset?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.asset?.serial}</div>
                                    </td>
                                    <td className="px-6 py-4">{ticket.title}</td>
                                    <td className="px-6 py-4">{ticket.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                        {ticket.status === 'Rejected' && ticket.rejectionReason && (
                                            <p className="text-xs text-red-500 mt-1">Reason: {ticket.rejectionReason}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        {ticket.status === 'Draft' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSendTicket(ticket._id)}
                                                    className="px-3 py-1 bg-primary text-white rounded text-xs font-medium hover:brightness-110"
                                                >
                                                    Send
                                                </button>
                                                <button
                                                    onClick={() => handleCancelTicket(ticket._id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewTicket(ticket);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm mr-3"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleCancelTicket(ticket._id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            {previewTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold">Ticket Preview</h3>
                                <p className="text-sm text-slate-500">{previewTicket.ticketNumber || 'Draft'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[previewTicket.status]}`}>
                                {previewTicket.status}
                            </span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Asset</div>
                                <div className="font-semibold">{previewTicket.asset?.name}</div>
                                <div className="text-sm text-slate-500">{previewTicket.asset?.serial}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Title</div>
                                <div className="font-medium">{previewTicket.title}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Type</div>
                                <div className="font-medium">{previewTicket.type}</div>
                            </div>

                            {previewTicket.description && (
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-medium mb-1">Description</div>
                                    <div className="text-slate-700 dark:text-slate-300">{previewTicket.description}</div>
                                </div>
                            )}

                            {previewTicket.rejectionReason && (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                    <div className="text-xs text-red-600 uppercase font-medium mb-1">Rejection Reason</div>
                                    <div className="text-red-700">{previewTicket.rejectionReason}</div>
                                </div>
                            )}

                            {previewTicket.history && previewTicket.history.length > 0 && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
                                    <h4 className="text-sm font-bold mb-4">Activity History</h4>
                                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                                        {previewTicket.history.map((item, index) => (
                                            <div key={index} className="relative">
                                                <div className={`absolute -left-[21px] top-1 size-3 rounded-full border-2 border-white dark:border-slate-800 ${item.status === 'Done' ? 'bg-green-500' :
                                                        item.status === 'Rejected' ? 'bg-red-500' :
                                                            item.status === 'In Progress' ? 'bg-blue-500' :
                                                                'bg-slate-400'
                                                    }`}></div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">{item.status}</span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(item.changedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                                        by <span className="font-medium">
                                                            {typeof item.changedBy === 'object' ? item.changedBy.name : 'Unknown'}
                                                        </span>
                                                    </div>
                                                    {item.notes && (
                                                        <div className="text-xs text-slate-500 italic mt-0.5">
                                                            "{item.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={() => setPreviewTicket(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Close
                            </button>

                            {previewTicket.status === 'Draft' && (
                                <>
                                    <button
                                        onClick={() => handleEditDraft(previewTicket)}
                                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleSendTicket(previewTicket._id)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:brightness-110"
                                    >
                                        Send to Department
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchData();
                    // We could potentially set previewTicket here if we returned the new ticket
                }}
                mode="request"
                availableAssets={myAssets}
                initialData={editingTicket}
            />
        </div>
    );
}
