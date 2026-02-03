import { useEffect, useState } from 'react';
import { MaintenanceTicket, maintenanceService } from '@/services/maintenanceService';
import { showErrorToast } from '@/utils/swal';

interface MaintenanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string | undefined;
}

export function MaintenanceDetailModal({ isOpen, onClose, ticketId }: MaintenanceDetailModalProps) {
    const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && ticketId) {
            fetchTicket(ticketId);
        } else {
            setTicket(null);
        }
    }, [isOpen, ticketId]);

    const fetchTicket = async (id: string) => {
        try {
            setLoading(true);
            const data = await maintenanceService.getTicket(id);
            setTicket(data);
        } catch (error) {
            console.error('Failed to load ticket:', error);
            showErrorToast('Failed to load ticket details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        Maintenance Detail {ticket?.ticketNumber ? `(${ticket.ticketNumber})` : ''}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        </div>
                    ) : ticket ? (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold
                                            ${ticket.status === 'Done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                    <div className="mt-1 text-slate-900 dark:text-white font-medium">{ticket.type}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requested By</label>
                                    <div className="mt-1 text-slate-900 dark:text-white text-sm">{ticket.requestedBy?.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500">{ticket.requestedBy?.department}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Technician</label>
                                    <div className="mt-1 text-slate-900 dark:text-white text-sm">{ticket.technician?.name || 'Unassigned'}</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                                    {ticket.title}
                                    {ticket.description && <p className="mt-1 border-t border-slate-200 dark:border-slate-700 pt-1">{ticket.description}</p>}
                                </div>
                            </div>

                            {/* Photos */}
                            {(ticket.beforePhotos?.length || 0) > 0 || (ticket.afterPhotos?.length || 0) > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(ticket.beforePhotos?.length || 0) > 0 && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Before</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {ticket.beforePhotos?.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90">
                                                        <img src={url} alt="Before" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(ticket.afterPhotos?.length || 0) > 0 && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">After</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {ticket.afterPhotos?.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90">
                                                        <img src={url} alt="After" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Supplies */}
                            {(ticket.suppliesUsed?.length || 0) > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Supplies Used</label>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Item</th>
                                                    <th className="px-4 py-2 text-right">Qty</th>
                                                    <th className="px-4 py-2 text-right">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {ticket.suppliesUsed?.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-2 dark:text-slate-300">{item.name}</td>
                                                        <td className="px-4 py-2 text-right dark:text-slate-300">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-right dark:text-slate-300">${item.cost * item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2 text-right dark:text-white">Total</td>
                                                    <td className="px-4 py-2 text-right text-indigo-600 dark:text-indigo-400">
                                                        ${ticket.cost || 0}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Maintenance History Log */}
                            {ticket.history && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Activity Log</label>
                                    <div className="space-y-3">
                                        {ticket.history.map((h, i) => (
                                            <div key={i} className="flex gap-3 text-sm">
                                                <div className="w-24 shrink-0 text-slate-500 text-xs pt-1">
                                                    {new Date(h.changedAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {h.status}
                                                        <span className="text-slate-400 font-normal ml-2 text-xs">
                                                            by {typeof h.changedBy === 'string' ? 'Unknown' : h.changedBy?.name}
                                                        </span>
                                                    </div>
                                                    {h.notes && <div className="text-slate-500 text-xs mt-1">{h.notes}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2">assignment_late</span>
                            <p>Ticket details not found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
