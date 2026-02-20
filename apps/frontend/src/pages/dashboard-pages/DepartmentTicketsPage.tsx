import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import { MaintenanceDetailModal } from '@/features/maintenance/components/MaintenanceDetailModal';
import { cn } from '@/lib/utils';

export default function DepartmentTicketsPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { counts } = useMaintenanceStore();

    const [activeTab, setActiveTab] = useState<'inbox' | 'history'>('inbox');
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('Sent');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const ticketsData = await maintenanceService.getDepartmentTickets();
            setTickets(ticketsData);
        } catch (error) {
            console.error('Failed to fetch department tickets:', error);
            showErrorToast('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Strict role-based permission check
        const allowedRoles = ['superuser', 'system_admin', 'admin', 'manager', 'dept_admin', 'supervisor', 'user', 'technician'];
        const isAllowed = user?.role && allowedRoles.includes(user.role);

        if (!isAllowed) {
            navigate('/');
            return;
        }

        fetchData();
    }, [user, navigate]);

    const handleView = (id: string) => {
        setSelectedTicketId(id);
        setIsDetailModalOpen(true);
    };

    const handleComplete = async (id: string) => {
        const result = await showConfirmDialog('Complete Ticket?', 'Mark this ticket as Done.');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.completeTicket(id);
            showSuccessToast('Ticket marked as Done');
            fetchData();
        } catch (error) {
            showErrorToast('Failed to complete ticket');
        }
    };

    const handleClose = async (id: string) => {
        const result = await showConfirmDialog('Close Ticket?', 'This will permanently close the ticket.');
        if (!result.isConfirmed) return;
        try {
            await maintenanceService.updateStatus(id, 'Closed', 'Ticket closed by department manager.');
            showSuccessToast('Ticket closed successfully');
            fetchData();
        } catch (error) {
            showErrorToast('Failed to close ticket');
        }
    };

    // Tab Logic
    const inboxStatuses = ['Sent', 'Accepted', 'Escalated', 'In Progress', 'Done', 'Pending'];
    const historyStatuses = ['Closed', 'Rejected', 'Cancelled'];

    // If filter status doesn't match current tab, auto-switch to first status of tab
    useEffect(() => {
        if (activeTab === 'inbox' && !inboxStatuses.includes(statusFilter)) {
            setStatusFilter('Sent');
        } else if (activeTab === 'history' && !historyStatuses.includes(statusFilter)) {
            setStatusFilter('Closed');
        }
    }, [activeTab]);

    const filteredTickets = tickets.filter(t => t.status === statusFilter);

    const filterStatusList = [
        // Inbox
        { id: 'Sent', label: 'New/Sent', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', tab: 'inbox' },
        { id: 'Accepted', label: 'Accepted', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', tab: 'inbox' },
        { id: 'Escalated', label: 'Escalated', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', tab: 'inbox' },
        { id: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', tab: 'inbox' },
        { id: 'Done', label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', tab: 'inbox' },
        { id: 'Pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', tab: 'inbox' },
        // History
        { id: 'Closed', label: 'Closed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', tab: 'history' },
        { id: 'Rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', tab: 'history' },
        { id: 'Cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400', tab: 'history' },
    ];

    const getStatusCount = (status: string) => {
        return counts?.deptTickets?.breakdown?.[status] || tickets.filter(t => t.status === status).length;
    };

    if (loading && tickets.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading department tickets...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Department Tickets</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">business</span>
                        Manage maintenance requests from your department
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('inbox')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === 'inbox'
                            ? "text-primary border-b-2 border-primary"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Inbox
                    {tickets.filter(t => inboxStatuses.includes(t.status)).length > 0 && (
                        <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                            {tickets.filter(t => inboxStatuses.includes(t.status)).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === 'history'
                            ? "text-primary border-b-2 border-primary"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    History
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {filterStatusList.filter(s => s.tab === activeTab).map((status) => {
                    const count = getStatusCount(status.id);
                    return (
                        <button
                            key={status.id}
                            onClick={() => setStatusFilter(status.id)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                                statusFilter === status.id
                                    ? status.color
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                        >
                            {status.label}
                            {count > 0 && (
                                <span className="bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticket #</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requestor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                    No tickets found in this status
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono text-sm">{ticket.ticketNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.asset?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.asset?.serial}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.requestedBy?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.requestedBy?.department}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm line-clamp-1">{ticket.title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ticket.status === 'In Progress' && (
                                                <button
                                                    onClick={() => handleComplete(ticket._id)}
                                                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-xs font-bold text-green-700 dark:text-green-400 transition-colors"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {ticket.status === 'Done' && (
                                                <button
                                                    onClick={() => handleClose(ticket._id)}
                                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors"
                                                >
                                                    Close
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleView(ticket._id)}
                                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <MaintenanceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                ticketId={selectedTicketId}
                onSuccess={fetchData}
            />
        </div>
    );
}
