import { useState, useEffect } from 'react';
import { assignmentService, Assignment } from '@/services/assignmentService';
import Swal from 'sweetalert2';

interface EditAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignment: Assignment | null;
}

export function EditAssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    assignment
}: EditAssignmentModalProps) {
    const [recipientName, setRecipientName] = useState('');
    const [recipientTitle, setRecipientTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [assignedDate, setAssignedDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && assignment) {
            setRecipientName(assignment.assignedTo || '');
            setRecipientTitle(assignment.assignedToTitle || '');
            setNotes(assignment.notes || '');
            setAssignedDate(assignment.assignedDate ? new Date(assignment.assignedDate).toISOString().split('T')[0] : '');
        }
    }, [isOpen, assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment) return;

        setIsLoading(true);

        try {
            await assignmentService.update(assignment._id, {
                assignedTo: recipientName,
                assignedToTitle: recipientTitle,
                notes,
                assignedDate: assignedDate ? new Date(assignedDate) : undefined
            });

            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Assignment details have been updated.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Update failed", error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to update assignment', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Assignment</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Recipient Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned To (Name)</label>
                            <input
                                type="text"
                                required
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={recipientName}
                                onChange={e => setRecipientName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title / Role</label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={recipientTitle}
                                onChange={e => setRecipientTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Date & Notes */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Date</label>
                            <input
                                type="date"
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={assignedDate}
                                onChange={e => setAssignedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                            <textarea
                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all h-[100px] resize-y"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
