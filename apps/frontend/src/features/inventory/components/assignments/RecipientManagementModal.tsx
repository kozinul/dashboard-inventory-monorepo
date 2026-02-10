import { useState } from 'react';
import { assignmentService } from '@/services/assignmentService';
import { RecipientGroup } from './RecipientListTable';
import Swal from 'sweetalert2';
import { AssetSelectionModal } from './AssetSelectionModal';

interface RecipientManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: RecipientGroup | null;
    onRefresh: () => void;
}

export function RecipientManagementModal({ isOpen, onClose, recipient, onRefresh }: RecipientManagementModalProps) {
    const [isAssetSelectionOpen, setIsAssetSelectionOpen] = useState(false);

    if (!isOpen || !recipient) return null;

    // Filter to only show Active assignments in the main list, or show all? 
    // Usually management view shows what they currently have (Active).
    // Let's show active first, maybe history later or in a separate tab.
    // For now, listing active assignments as per "tabel seperti di add assigment" which implies current assets.
    const activeAssignments = recipient.assignments.filter(a => a.status === 'assigned');

    const handleReturn = async (id: string) => {
        const result = await Swal.fire({
            title: 'Return Asset?',
            text: "This will remove the asset from this recipient.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffb020',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, return it!'
        });

        if (result.isConfirmed) {
            try {
                await assignmentService.returnAsset(id, { returnedDate: new Date() });
                Swal.fire('Returned', 'Asset has been returned', 'success');
                onRefresh();
            } catch (error) {
                Swal.fire('Error', 'Failed to return asset', 'error');
            }
        }
    };

    const handleAddAssets = async (assets: any[]) => {
        try {
            // Add new assignments for this recipient
            await Promise.all(assets.map(asset =>
                assignmentService.create({
                    assetId: asset._id,
                    assignedTo: recipient.name,
                    assignedToTitle: recipient.title,
                    locationId: asset.locationId?._id, // Keep existing location or undefined
                    assignedDate: new Date()
                })
            ));

            Swal.fire('Success', `${assets.length} assets assigned to ${recipient.name}`, 'success');
            onRefresh();
            setIsAssetSelectionOpen(false);
        } catch (error) {
            Swal.fire('Error', 'Failed to assign assets', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Assignment?',
            text: "This will remove the assignment record permanently. The asset will be set to 'active'.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await assignmentService.delete(id);
                Swal.fire('Deleted!', 'The assignment has been deleted.', 'success');
                onRefresh();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete assignment', 'error');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{recipient.name}</h2>
                        <p className="text-slate-500 text-sm">{recipient.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Assigned Assets</h3>
                        <button
                            onClick={() => setIsAssetSelectionOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Asset
                        </button>
                    </div>

                    <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-500">Asset</th>
                                    <th className="p-3 font-semibold text-slate-500">Assigned Date</th>
                                    <th className="p-3 font-semibold text-slate-500">Status</th>
                                    <th className="p-3 font-semibold text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeAssignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400">
                                            No assets currently assigned.
                                        </td>
                                    </tr>
                                ) : (
                                    activeAssignments.map((assignment) => (
                                        <tr key={assignment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {assignment.assetId?.name || 'Unknown Asset'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {(assignment.assetId as any)?.assetCode}
                                                </div>
                                                {assignment.notes && (
                                                    <div className="text-xs text-slate-400 mt-1 italic">
                                                        "{assignment.notes}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400">
                                                {new Date(assignment.assignedDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium 
                                                    ${assignment.status === 'returned'
                                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                    {assignment.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleReturn(assignment._id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                                                    title="Return Asset"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(assignment._id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete Assignment"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AssetSelectionModal
                isOpen={isAssetSelectionOpen}
                onClose={() => setIsAssetSelectionOpen(false)}
                onSelect={handleAddAssets}
                alreadySelectedIds={activeAssignments.map(a => a.assetId._id)}
            />
        </div>
    );
}
