
import { useState, useEffect } from 'react';
import { showSuccessToast, showErrorToast } from '@/utils/swal';
import { Department, departmentService } from '@/services/departmentService';
import { MaintenanceTicket, maintenanceService } from '@/services/maintenanceService';


interface EscalateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ticket: MaintenanceTicket;
}

export function EscalateTicketModal({ isOpen, onClose, onSuccess, ticket }: EscalateTicketModalProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadDepartments();
        }
    }, [isOpen]);

    const loadDepartments = async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data.filter(d => d.status === 'Active'));
        } catch (error) {
            console.error('Failed to load departments', error);
            showErrorToast('Failed to load departments');
        }
    };

    const handleEscalate = async () => {
        if (!selectedDept) {
            showErrorToast('Please select a department');
            return;
        }

        setIsLoading(true);
        try {
            await maintenanceService.escalateTicket(ticket._id!, selectedDept, notes);
            showSuccessToast('Ticket escalated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            showErrorToast(error.response?.data?.message || 'Failed to escalate ticket');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">Escalate Ticket</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Target Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                            <option value="">Select Department...</option>
                            {departments.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            rows={4}
                            placeholder="Why is this ticket being escalated?"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEscalate}
                            disabled={isLoading || !selectedDept}
                            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            Escalate Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
