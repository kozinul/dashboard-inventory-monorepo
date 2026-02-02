import { useState, useEffect } from 'react';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';

const statusColors: Record<string, string> = {
    'Accepted': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function AssignedTicketsPage() {
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await maintenanceService.getAssignedTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch assigned tickets:', error);
            showErrorToast('Failed to load assigned tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (id: string) => {
        const result = await showConfirmDialog('Start Maintenance?', 'This will update the status to In Progress.');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.startTicket(id);
            showSuccessToast('Maintenance started');
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to start');
        }
    };

    const handleComplete = async (id: string) => {
        const result = await showConfirmDialog('Complete Maintenance?', 'Mark this task as done.');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.completeTicket(id);
            showSuccessToast('Ticket completed');
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to complete');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading your tasks...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Assignments</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">engineering</span>
                        Manage maintenance tickets assigned to you
                    </p>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticket #</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requested By</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2">assignment_ind</span>
                                    <p>No tickets assigned to you yet.</p>
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono text-sm">{ticket.ticketNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.asset?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.asset?.serial}</div>
                                    </td>
                                    <td className="px-6 py-4">{ticket.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-slate-100 text-slate-800'}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{ticket.requestedBy?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.requestedBy?.department}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ticket.status === 'Accepted' && (
                                                <button
                                                    onClick={() => handleStart(ticket._id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                                >
                                                    Start Work
                                                </button>
                                            )}
                                            {ticket.status === 'In Progress' && (
                                                <button
                                                    onClick={() => handleComplete(ticket._id)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
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
