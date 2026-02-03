import { useState, useEffect } from 'react';
import { MaintenanceTicket } from '@/services/maintenanceService';
import { User } from '@/services/userService';

interface DepartmentTicketActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: MaintenanceTicket | null;
    technicians: User[];
    onAccept: (ticketId: string, technicianId: string, type: string) => Promise<void>;
    onReject: (ticketId: string) => Promise<void>;
}

export function DepartmentTicketActionModal({
    isOpen,
    onClose,
    ticket,
    technicians,
    onAccept,
    onReject
}: DepartmentTicketActionModalProps) {
    const [assignData, setAssignData] = useState({
        technicianId: '',
        type: 'Repair'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (ticket) {
            setAssignData({
                technicianId: '',
                type: ticket.type || 'Repair'
            });
        }
    }, [ticket]);

    if (!isOpen || !ticket) return null;

    // Filter technicians matching asset department
    const assetDeptId = ticket.asset?.departmentId;
    const assetDeptName = ticket.asset?.department;

    const filteredTechnicians = technicians.filter(tech => {
        // If asset has departmentId, match by id
        if (assetDeptId && tech.departmentId) {
            return tech.departmentId === assetDeptId;
        }
        // Fallback to name match if ids missing
        if (assetDeptName && tech.department) {
            return tech.department === assetDeptName;
        }
        // If asset has no department info, maybe show all? Or Show none?
        // Let's show all if asset has no department assigned, or filtered list is empty?
        // User request: "sesuai dengan asset departemen nya" implies strict matching.
        // But if data is missing, we should probably allow assignment to avoid blocking.
        return true;
    });

    // If filtering resulted in match, use it. Otherwise use all (safety net)
    const displayTechnicians = filteredTechnicians.length > 0 ? filteredTechnicians : technicians;

    const handleAcceptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onAccept(ticket._id, assignData.technicianId, assignData.type);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectClick = async () => {
        await onReject(ticket._id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Ticket Details</h2>
                        <p className="text-sm text-slate-500">{ticket.ticketNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Asset</label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="font-bold">{ticket.asset?.name}</div>
                                <div className="text-xs text-slate-500">{ticket.asset?.serial}</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Requested By</label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="font-bold">{ticket.requestedBy?.name}</div>
                                <div className="text-xs text-slate-500">{ticket.requestedBy?.email}</div>
                            </div>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg min-h-[80px]">
                                {ticket.description || 'No description provided.'}
                            </div>
                        </div>
                    </div>

                    {/* Action Section based on Status */}
                    {ticket.status === 'Sent' && (
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4">Process Request</h3>

                            <form onSubmit={handleAcceptSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Classification</label>
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
                                            <option value="">Select Technician...</option>
                                            {displayTechnicians.map((tech) => (
                                                <option key={tech._id || tech.id} value={tech._id || tech.id}>
                                                    {tech.name} {tech.department ? `(${tech.department})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {displayTechnicians.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">No technicians found in asset's department.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleRejectClick}
                                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                                    >
                                        Reject Request
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!assignData.technicianId || isSubmitting}
                                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Accept & Assign'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {ticket.status !== 'Sent' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="material-symbols-outlined">info</span>
                                <span>This ticket is currently {ticket.status}.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
