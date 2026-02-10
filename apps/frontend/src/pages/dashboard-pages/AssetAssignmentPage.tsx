import { useState, useEffect, useMemo } from 'react';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { RecipientListTable, RecipientGroup } from '@/features/inventory/components/assignments/RecipientListTable';
import { RecipientManagementModal } from '@/features/inventory/components/assignments/RecipientManagementModal';
import { EditRecipientModal } from '@/features/inventory/components/assignments/EditRecipientModal';
import { AssignmentModal } from '@/features/inventory/components/assignments/AssignmentModal';
import { showConfirmDialog, showSuccess, showErrorToast } from '@/utils/swal';

export default function AssetAssignmentPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    // Recipient View State
    const [selectedRecipient, setSelectedRecipient] = useState<RecipientGroup | null>(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

    // Edit Recipient Modal
    const [editingRecipient, setEditingRecipient] = useState<RecipientGroup | null>(null);
    const [isEditRecipientModalOpen, setIsEditRecipientModalOpen] = useState(false);

    // New Assignment Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await assignmentService.getAll();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to load assignments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    // Group Assignments by Recipient
    const recipientGroups = useMemo(() => {
        const groups: Record<string, RecipientGroup> = {};

        assignments.forEach(assignment => {
            // Group by Manual Name
            const name = assignment.assignedTo || 'Unknown';

            if (!groups[name]) {
                groups[name] = {
                    name,
                    title: assignment.assignedToTitle || '',
                    activeCount: 0,
                    assignments: []
                };
            }

            groups[name].assignments.push(assignment);

            if (assignment.status === 'assigned') {
                groups[name].activeCount++;
            }

            // Update title if missing (take from latest assignment)
            if (!groups[name].title && assignment.assignedToTitle) {
                groups[name].title = assignment.assignedToTitle;
            }

            // Extract Location Name (Active assignments take precedence)
            if (assignment.locationId && typeof assignment.locationId === 'object') {
                const loc = assignment.locationId as any;
                // Construct readable location string
                let locString = loc.name || '';
                if (loc.building) locString = `${loc.building} - ${locString}`;

                // If this is an active assignment, overwrite any previous location (as we want current location)
                if (assignment.status === 'assigned') {
                    groups[name].location = locString;
                } else if (!groups[name].location) {
                    // Fallback to old location if no active ones yet
                    groups[name].location = locString;
                }
            }
        });

        // Convert to array and sort by name
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [assignments]);

    // Derived state for the modal
    const activeRecipientGroup = useMemo(() => {
        if (!selectedRecipient) return null;
        return recipientGroups.find(g => g.name === selectedRecipient.name) || null;
    }, [recipientGroups, selectedRecipient]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Asset Assignments</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage asset distribution by recipient</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 font-bold"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Assignment
                </button>
            </div>

            {/* Recipient List View */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <RecipientListTable
                    recipients={recipientGroups}
                    onManage={(recipient) => {
                        setSelectedRecipient(recipient);
                        setIsManagementModalOpen(true);
                    }}
                    onEdit={(recipient) => {
                        setEditingRecipient(recipient);
                        setIsEditRecipientModalOpen(true);
                    }}
                    onDelete={async (recipient) => {
                        const result = await showConfirmDialog(
                            `Delete ${recipient.name}?`,
                            'This will remove ALL assignment records for this recipient. Active assets will become available again.',
                            'Yes, delete everything!',
                            'delete'
                        );

                        if (result.isConfirmed) {
                            try {
                                await assignmentService.bulkDeleteRecipient(recipient.name);
                                showSuccess('Deleted!', 'Recipient and assignments removed.');
                                fetchAssignments();
                            } catch (err) {
                                console.error(err);
                                showErrorToast('Failed to delete recipient assignments');
                            }
                        }
                    }}
                />
            )}

            {/* Modals */}
            <RecipientManagementModal
                isOpen={isManagementModalOpen}
                onClose={() => {
                    setIsManagementModalOpen(false);
                    setSelectedRecipient(null);
                }}
                recipient={activeRecipientGroup}
                onRefresh={fetchAssignments}
            />

            <EditRecipientModal
                isOpen={isEditRecipientModalOpen}
                onClose={() => setIsEditRecipientModalOpen(false)}
                recipient={editingRecipient}
                onSuccess={() => {
                    fetchAssignments();
                    setIsEditRecipientModalOpen(false);
                }}
            />

            <AssignmentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchAssignments();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
}
