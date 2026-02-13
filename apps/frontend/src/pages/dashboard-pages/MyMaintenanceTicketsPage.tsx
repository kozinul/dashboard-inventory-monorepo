import { useState, useEffect } from 'react';
import { maintenanceService, MaintenanceTicket, NavCounts } from '@/services/maintenanceService';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { assignmentService } from '@/services/assignmentService';
import { assetService } from '@/services/assetService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

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
    const [counts, setCounts] = useState<NavCounts | null>(null);
    const [myAssets, setMyAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewTicket, setPreviewTicket] = useState<MaintenanceTicket | null>(null);
    const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);

    const isPrivileged = user?.role === 'superuser' || user?.role === 'admin';

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ticketsData, countsData] = await Promise.all([
                maintenanceService.getMyTickets(),
                maintenanceService.getNavCounts()
            ]);
            setTickets(ticketsData);
            setCounts(countsData);

            // Fetch assets
            if (isPrivileged) {
                const allAssets = await assetService.getAll({ limit: 1000 });
                const available = (allAssets.data || []).filter((a: any) =>
                    !['maintenance', 'under maintenance', 'request maintenance'].includes(a.status)
                );
                setMyAssets(available);
            } else {
                const [deptAssetsResponse, myAssignments] = await Promise.all([
                    assetService.getAll({ limit: 1000 }),
                    assignmentService.getUserAssignments(user!._id)
                ]);

                const deptAssets = (deptAssetsResponse.data || []).filter((a: any) =>
                    !['maintenance', 'under maintenance', 'request maintenance'].includes(a.status)
                );

                const assignedAssets = myAssignments
                    .filter((a: any) => a.status === 'assigned')
                    .map((a: any) => a.assetId)
                    .filter((a: any) =>
                        a && !['maintenance', 'under maintenance', 'request maintenance'].includes(a.status)
                    );

                const combinedMap = new Map();
                deptAssets.forEach(a => combinedMap.set(a._id, a));
                assignedAssets.forEach(a => combinedMap.set(a._id, a));

                setMyAssets(Array.from(combinedMap.values()));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showErrorToast('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    if (loading && tickets.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading your tickets...</div>;
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
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-widest">Total</div>
                    <div className="text-2xl font-bold">{counts?.myTickets.total || 0}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark relative overflow-hidden group">
                    <div className="text-sm text-slate-600 uppercase font-bold tracking-widest">Draft</div>
                    <div className="text-2xl font-bold text-slate-600">{counts?.myTickets.breakdown['Draft'] || 0}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark relative overflow-hidden group">
                    <div className="text-sm text-purple-600 uppercase font-bold tracking-widest">Sent</div>
                    <div className="text-2xl font-bold text-purple-600">{counts?.myTickets.breakdown['Sent'] || 0}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark relative overflow-hidden group">
                    <div className="text-sm text-blue-600 uppercase font-bold tracking-widest flex items-center justify-between">
                        In Progress
                        {(counts?.myTickets.breakdown['In Progress'] || 0) > 0 && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{counts?.myTickets.breakdown['In Progress'] || 0}</div>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-amber-600 uppercase font-bold tracking-widest flex items-center justify-between">
                        Pending Action
                        {(counts?.myTickets.breakdown['Pending'] || 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[10px] text-white font-bold animate-bounce">
                                {counts?.myTickets.breakdown['Pending']}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{(counts?.myTickets.breakdown['Pending'] || 0) + (counts?.myTickets.breakdown['Rejected'] || 0)}</div>
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
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                                    No tickets yet. Create one to request maintenance.
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
                                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[ticket.status])}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {ticket.status === 'Draft' && (
                                                <>
                                                    <button onClick={() => handleSendTicket(ticket._id)} className="px-3 py-1 bg-primary text-white rounded text-xs font-medium">Send</button>
                                                    <button onClick={() => handleCancelTicket(ticket._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                                </>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setPreviewTicket(ticket); }} className="text-indigo-600 hover:text-indigo-800 text-sm">View</button>
                                        </div>
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
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 w-full max-w-5xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold">Ticket Preview</h3>
                                <p className="text-sm text-slate-500">{previewTicket.ticketNumber || 'Draft'}</p>
                            </div>
                            <button onClick={() => setPreviewTicket(null)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {/* Simple Preview Content */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div><label className="text-xs uppercase font-bold text-slate-400">Asset</label><p className="font-medium">{previewTicket.asset?.name} ({previewTicket.asset?.serial})</p></div>
                                    <div><label className="text-xs uppercase font-bold text-slate-400">Title</label><p className="text-lg font-medium">{previewTicket.title}</p></div>
                                    <div><label className="text-xs uppercase font-bold text-slate-400">Status</label><p><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusColors[previewTicket.status])}>{previewTicket.status}</span></p></div>
                                </div>
                                <div className="space-y-4">
                                    <div><label className="text-xs uppercase font-bold text-slate-400">Description</label><p className="text-slate-600 dark:text-slate-400">{previewTicket.description || 'No description'}</p></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            {previewTicket.status === 'Draft' && (
                                <button onClick={() => handleEditDraft(previewTicket)} className="px-4 py-2 border border-slate-300 rounded-lg">Edit</button>
                            )}
                            <button onClick={() => setPreviewTicket(null)} className="px-4 py-2 bg-primary text-white rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => { setIsCreateModalOpen(false); fetchData(); }}
                mode="request"
                availableAssets={myAssets}
                initialData={editingTicket}
            />
        </div>
    );
}
