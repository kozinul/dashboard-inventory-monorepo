import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceService, MaintenanceTicket } from '@/services/maintenanceService';
import { showErrorToast, showConfirmDialog, showSuccessToast } from '@/utils/swal';
import { useAuthStore } from '@/store/authStore';
import { MaintenanceModal } from '@/features/maintenance/components/MaintenanceModal';
import { TicketWorkModal } from '@/features/maintenance/components/TicketWorkModal';

export default function MaintenanceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);

    const isTechnician = user?.role === 'technician';
    const isAdmin = user?.role === 'superuser' || user?.role === 'admin' || user?.role === 'administrator';

    useEffect(() => {
        if (id) {
            fetchTicket(id);
        }
    }, [id]);

    const fetchTicket = async (ticketId: string) => {
        try {
            setLoading(true);
            const data = await maintenanceService.getById(ticketId);
            setTicket(data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            showErrorToast('Failed to load ticket details');
            navigate('/maintenance');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (!ticket) return;

        // Logic: specific action based on Role & Status
        if (isTechnician) {
            // Technicians only edit "Work" on assigned tickets
            if ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id) {
                setIsWorkModalOpen(true);
                return;
            }
        }

        // Default to admin/manager edit or if technician is viewing unrelated ticket (fallback)
        setIsCreateModalOpen(true);
    };

    const handleDelete = async () => {
        if (!ticket) return;
        const result = await showConfirmDialog('Are you sure?', 'You wont be able to revert this!');
        if (!result.isConfirmed) return;

        try {
            await maintenanceService.delete(ticket._id!);
            showSuccessToast('Record deleted successfully');
            navigate('/maintenance');
        } catch (error) {
            console.error('Failed to delete record:', error);
            showErrorToast('Failed to delete record');
        }
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setIsWorkModalOpen(false);
    };

    const handleSuccess = () => {
        if (id) fetchTicket(id);
        handleModalClose();
    };

    if (loading) return <div className="p-8 text-center">Loading ticket details...</div>;
    if (!ticket) return <div className="p-8 text-center">Ticket not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Ticket #{ticket.ticketNumber}</h1>
                        <p className="text-slate-500 dark:text-slate-400">Maintenace Detail View</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Technicians: Start Work */}
                    {isTechnician && ticket.status === 'Accepted' && ((ticket.technician as any)?._id === user?._id || (ticket.technician as any) === user?._id) && (
                        <button
                            onClick={async () => {
                                try {
                                    await maintenanceService.startTicket(ticket._id!);
                                    showSuccessToast('Work started');
                                    fetchTicket(ticket._id!);
                                } catch (error) {
                                    console.error(error);
                                    showErrorToast('Failed to start work');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Start Work
                        </button>
                    )}

                    {/* Manager: Close Ticket */}
                    {isAdmin && ticket.status === 'Done' && (
                        <button
                            onClick={async () => {
                                const result = await showConfirmDialog('Close Ticket?', 'This will finalize the maintenance record.');
                                if (!result.isConfirmed) return;
                                try {
                                    // Assuming a closeTicket method exists or we update status to 'Closed' manually if needed.
                                    // For now, let's assume 'Closed' is a valid status update or we need a specific endpoint.
                                    // The plan said 'Close Ticket', usually meaning status -> Closed.
                                    // Let's use update for now if no specific close endpoint exists, or check service.
                                    // Checking service... completeTicket exists (sets to Done). Reject exists.
                                    // If 'Done' -> 'Closed' isn't standard, maybe 'Done' IS closed?
                                    // User asked: "dept ticket bisa mengclose tiketnya dengan button close jika status nya done"
                                    // So 'Done' -> 'Closed'.
                                    // I'll assume standard update to 'Closed' status works or I might need to add it to generic update.
                                    await maintenanceService.update(ticket._id!, { status: 'Closed' });
                                    showSuccessToast('Ticket closed');
                                    fetchTicket(ticket._id!);
                                } catch (error) {
                                    console.error(error);
                                    showErrorToast('Failed to close ticket');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Close Ticket
                        </button>
                    )}

                    {/* Actions based on role */}
                    {(ticket.status !== 'Done' && ticket.status !== 'Closed' || isAdmin) && (
                        <>
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                {isTechnician ? 'Update Work' : 'Edit Ticket'}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-sm transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Asset Details</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                            <p className="font-bold text-lg dark:text-white">{ticket.asset?.name || 'Unknown Asset'}</p>
                            <p className="text-sm text-slate-500">Serial: {ticket.asset?.serial || 'N/A'}</p>
                            <p className="text-sm text-slate-500">Dept: {ticket.asset?.department || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Request Info</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Requested By:</span>
                                <span className="font-medium dark:text-slate-300">{ticket.requestedBy?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date:</span>
                                <span className="font-medium dark:text-slate-300">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Status:</span>
                                <span className="font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">{ticket.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Type:</span>
                                <span className="font-medium dark:text-slate-300">{ticket.type || 'Unspecified'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Description</h3>
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg">
                        {ticket.description || 'No description provided.'}
                    </p>
                </div>

                {/* Supplies Used Section */}
                {ticket.suppliesUsed && ticket.suppliesUsed.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Supplies Used</h3>
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Item Name</th>
                                        <th className="px-4 py-3 font-medium">Quantity</th>
                                        <th className="px-4 py-3 font-medium text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-card-dark">
                                    {ticket.suppliesUsed.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.cost * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                                        <td className="px-4 py-3" colSpan={2}>Total Cost</td>
                                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                                                ticket.suppliesUsed.reduce((acc, item) => acc + (item.cost * item.quantity), 0)
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {ticket.visualProof && ticket.visualProof.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Visual Proof</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {ticket.visualProof.map((img, idx) => (
                                <img key={idx} src={img} alt={`Proof ${idx}`} className="h-32 rounded-lg border border-slate-200 dark:border-border-dark" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6">
                <h3 className="text-lg font-bold dark:text-white mb-4">History</h3>
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                    {ticket.history?.map((event: any, idx: number) => (
                        <div key={idx} className="mb-6 ml-6">
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-card-dark dark:bg-blue-900">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            </span>
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{event.status}</h4>
                                <time className="text-xs text-slate-500">{new Date(event.changedAt).toLocaleString()}</time>
                            </div>
                            <p className="text-sm text-slate-500">{event.notes}</p>
                            {event.changedBy && (
                                <p className="text-xs text-slate-400 mt-1">By: {event.changedBy.name || 'System'}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <MaintenanceModal
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                initialData={ticket}
            />

            {ticket && (
                <TicketWorkModal
                    isOpen={isWorkModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleSuccess}
                    ticket={ticket}
                />
            )}
        </div>
    );
}
