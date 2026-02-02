import { useState, useEffect } from 'react';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { userService, User } from '@/services/userService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '@/utils/swal';
import Swal from 'sweetalert2';

const statusColors: Record<string, string> = {
    'Draft': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'Sent': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Accepted': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Pending': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Cancelled': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400'
};

export default function DepartmentTicketsPage() {
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    // Assign Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
    const [assignData, setAssignData] = useState({
        technicianId: '',
        type: ''
    });

    useEffect(() => {
        fetchData();
        fetchTechnicians();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await maintenanceService.getDepartmentTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch department tickets:', error);
            showErrorToast('Failed to load department tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const users = await userService.getAll();
            // Filter users with role 'technician'
            setTechnicians(users.filter(u => u.role === 'technician'));
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const openAssignModal = (ticket: MaintenanceTicket) => {
        setSelectedTicket(ticket);
        setAssignData({
            technicianId: '',
            type: ticket.type
        });
        setIsAssignModalOpen(true);
    };

    const handleAcceptTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !assignData.technicianId) return;

        try {
            await maintenanceService.acceptTicket(selectedTicket._id, assignData.technicianId, assignData.type);
            showSuccessToast('Ticket accepted and technician assigned');
            setIsAssignModalOpen(false);
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to accept ticket');
        }
    };

    const handleReject = async (id: string) => {
        const { value: reason } = await Swal.fire({
            title: 'Reject Ticket',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Enter the reason...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Please provide a reason';
                return null;
            }
        });

        if (reason) {
            try {
                await maintenanceService.rejectTicket(id, reason);
                showSuccessToast('Ticket rejected');
                fetchData();
            } catch (error: any) {
                showErrorToast(error.response?.data?.message || 'Failed to reject');
            }
        }
    };

    const handleComplete = async (id: string) => {
        const result = await showConfirmDialog('Complete Ticket?', 'Mark this maintenance as done.');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.completeTicket(id);
            showSuccessToast('Ticket completed');
            fetchData();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to complete');
        }
    };

    const filteredTickets = filter === 'all'
        ? tickets
        : tickets.filter(t => t.status === filter);

    if (loading) {
        return <div className="p-8 text-center">Loading department tickets...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Department Tickets</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">business</span>
                        Manage maintenance requests from your department
                    </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'Sent', 'Accepted', 'In Progress', 'Done'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === status
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                    <div className="text-sm text-slate-500">Total</div>
                    <div className="text-2xl font-bold">{tickets.length}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-600">New Requests</div>
                    <div className="text-2xl font-bold text-purple-600">{tickets.filter(t => t.status === 'Sent').length}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <div className="text-sm text-indigo-600">Accepted</div>
                    <div className="text-2xl font-bold text-indigo-600">{tickets.filter(t => t.status === 'Accepted').length}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600">In Progress</div>
                    <div className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'In Progress').length}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requested By</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Technician</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                    <p>No tickets found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono text-sm">{ticket.ticketNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.asset?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.asset?.serial}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ticket.requestedBy?.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.requestedBy?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {ticket.technician?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ticket.status === 'Sent' && (
                                                <>
                                                    <button
                                                        onClick={() => openAssignModal(ticket)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(ticket._id)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {/* Managers can also complete tickets if needed */}
                                            {ticket.status === 'In Progress' && (
                                                <button
                                                    onClick={() => handleComplete(ticket._id)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
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

            {/* Assign Modal */}
            {isAssignModalOpen && selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-card-dark rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-1">Accept & Assign Technician</h3>
                        <p className="text-sm text-slate-500 mb-4">Ticket {selectedTicket.ticketNumber}</p>

                        <form onSubmit={handleAcceptTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Ticket Type</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    value={assignData.type}
                                    onChange={(e) => setAssignData({ ...assignData, type: e.target.value })}
                                    required
                                >
                                    <option value="Repair">Repair</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Inspection">Inspection</option>
                                    <option value="Installation">Installation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Assign Technician</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    value={assignData.technicianId}
                                    onChange={(e) => setAssignData({ ...assignData, technicianId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Technician</option>
                                    {technicians.map((tech) => (
                                        <option key={tech._id || tech.id} value={tech._id || tech.id}>
                                            {tech.name}
                                        </option>
                                    ))}
                                </select>
                                {technicians.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No technicians found. Please add users with 'Technician' role.</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                                    disabled={!assignData.technicianId}
                                >
                                    Accept & Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
