
import { useState, useEffect } from 'react';
import { assetService, Asset } from '@/services/assetService';
import { userService } from '@/services/userService';
import { User } from '@dashboard/schemas';
import Swal from 'sweetalert2';
import { assignmentService } from '@/services/assignmentService';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedUserId?: string | null;
    preSelectedAssetId?: string | null;
}

export function AssignmentModal({
    isOpen,
    onClose,
    onSuccess,
    preSelectedUserId,
    preSelectedAssetId
}: AssignmentModalProps) {
    const [selectedUserId, setSelectedUserId] = useState(preSelectedUserId || '');
    const [selectedAssetId, setSelectedAssetId] = useState(preSelectedAssetId || '');
    const [notes, setNotes] = useState('');
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);

    // Data Loading
    const [users, setUsers] = useState<User[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
            // Reset fields if not pre-selected
            if (!preSelectedUserId) setSelectedUserId('');
            if (!preSelectedAssetId) setSelectedAssetId('');
            setNotes('');
            setAssignedDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, assetsResponse] = await Promise.all([
                // If user pre-selected, no need to fetch all users unless we want to change user (which we might prevent if pre-selected)
                // for simplicity, fetch all or optimization later
                userService.getAll(),
                assetService.getAll()
            ]);

            setUsers(usersData);

            // Filter assets: 
            // 1. Must be active status
            // 2. Or if preSelectedAssetId is passed, allow it (though it should be active/assignable)
            const allAssets = assetsResponse.data;
            const available = allAssets.filter((a: Asset) =>
                a.status === 'active' || a._id === preSelectedAssetId
            );
            setAssets(available);

        } catch (error) {
            console.error("Failed to load assignment options", error);
            Swal.fire('Error', 'Failed to load options', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId || !selectedAssetId) {
            Swal.fire('Error', 'Please select both user and asset', 'warning');
            return;
        }

        try {
            await assignmentService.create({
                userId: selectedUserId,
                assetId: selectedAssetId,
                notes,
                assignedDate: new Date(assignedDate)
            });

            Swal.fire({
                icon: 'success',
                title: 'Assigned!',
                text: 'Asset has been successfully assigned.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to assign', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Assignment</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">User</label>
                        {preSelectedUserId ? (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed">
                                {users.find(u => (u as any)._id === preSelectedUserId)?.name || 'Selected User'}
                            </div>
                        ) : (
                            <select
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                                required
                                disabled={isLoading}
                            >
                                <option value="">-- Select User --</option>
                                {users.map(user => (
                                    <option key={(user as any)._id} value={(user as any)._id}>
                                        {user.name} ({user.department || 'No Dept'})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Asset Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Asset</label>
                        {preSelectedAssetId ? (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed">
                                {assets.find(a => a._id === preSelectedAssetId)?.name || 'Selected Asset'}
                            </div>
                        ) : (
                            <select
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={selectedAssetId}
                                onChange={e => setSelectedAssetId(e.target.value)}
                                required
                                disabled={isLoading}
                            >
                                <option value="">-- Select Asset --</option>
                                {assets.map(asset => (
                                    <option key={asset._id} value={asset._id}>
                                        {asset.name} - {asset.serial}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Assigned Date */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                        <input
                            type="date"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={assignedDate}
                            onChange={e => setAssignedDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Add optional notes..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
