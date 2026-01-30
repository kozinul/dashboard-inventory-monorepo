
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { assetService, Asset } from '@/services/assetService';
import { User } from '@dashboard/schemas';
import Swal from 'sweetalert2';

export default function UserDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Assignment Form State
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (!id) return;
            const [userData, assignmentData] = await Promise.all([
                userService.getById(id),
                assignmentService.getUserAssignments(id)
            ]);
            setUser(userData);
            setAssignments(assignmentData);
        } catch (error) {
            console.error("Failed to fetch user details", error);
            Swal.fire('Error', 'Failed to load user data', 'error');
            navigate('/users');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableAssets = async () => {
        try {
            // Need a way to get available assets only. 
            // For now, get all and filter locally or add endpoint. 
            // Assuming getAssets returns all, checking status.
            const response = await assetService.getAll();
            const assets = response.data;
            // Filter inactive/assigned assets
            // Note: Depending on asset implementation, 'status' might be 'active' but assigned?
            // Prompt says: "jika sudah di assign maka tidak bisa di ambil oleh user lain"
            // My backend check ensures this, but UI should filter.
            // I'll check assignments or asset status.
            // Ideally asset status should be 'available' or not 'assigned'.
            // Let's filter by status !== 'retired' and not in active assignments?
            // Actually, the new Assignment model handles assignment. Asset might not update status.
            // But backend check exists. I'll just show all active assets and let backend reject if taken 
            // OR better: filter those whose status is 'active' and maybe check against all active assignments (expensive).
            // Let's assume 'status' on Asset is used or I'll trust the user to pick, and show error if taken.
            setAvailableAssets(assets.filter((a: Asset) => a.status === 'active'));
        } catch (error) {
            console.error("Failed to fetch assets", error);
        }
    };

    const handleOpenAssignModal = () => {
        fetchAvailableAssets();
        setIsAssignModalOpen(true);
        setSelectedAssetId('');
        setNotes('');
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!id) return;
            await assignmentService.create({
                userId: id,
                assetId: selectedAssetId,
                notes
            });
            Swal.fire('Success', 'Asset assigned successfully', 'success');
            setIsAssignModalOpen(false);
            fetchData();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to assign asset', 'error');
        }
    };

    const handleReturn = async (assignmentId: string) => {
        const result = await Swal.fire({
            title: 'Return Asset?',
            text: "Confirm return of this asset",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, return it'
        });

        if (result.isConfirmed) {
            try {
                await assignmentService.returnAsset(assignmentId, {});
                Swal.fire('Returned!', 'Asset has been returned.', 'success');
                fetchData();
            } catch (error) {
                console.error("Failed to return asset", error);
                Swal.fire('Error', 'Failed to return asset', 'error');
            }
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!user) return <div className="p-8">User not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/users')} className="p-2 hover:bg-slate-100 rounded-full">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold">{user.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark h-fit">
                    <div className="flex flex-col items-center text-center mb-6">
                        <img
                            src={user.avatarUrl || 'https://www.gravatar.com/avatar?d=mp'}
                            alt={user.name}
                            className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-slate-100 dark:border-slate-800"
                        />
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-slate-500">{user.email}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                            <p className="font-medium">{user.department || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Designation</label>
                            <p className="font-medium">{user.designation || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                            <p className="font-medium">{user.status}</p>
                        </div>
                    </div>
                </div>

                {/* Assignments Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Assigned Assets</h2>
                        <button
                            onClick={handleOpenAssignModal}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Assign Asset
                        </button>
                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Asset</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Assigned Date</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Notes</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No active assignments</td>
                                    </tr>
                                ) : (
                                    assignments.map(assignment => (
                                        <tr key={assignment._id}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold">{assignment.assetId?.name || 'Unknown Asset'}</p>
                                                    <p className="text-xs text-slate-500">{assignment.assetId?.serial || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(assignment.assignedDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">
                                                {assignment.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {assignment.status === 'assigned' ? (
                                                    <button
                                                        onClick={() => handleReturn(assignment._id)}
                                                        className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded"
                                                    >
                                                        Return
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Returned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">Assign Asset</h2>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Select Asset</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                                    value={selectedAssetId}
                                    onChange={e => setSelectedAssetId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Asset --</option>
                                    {availableAssets.map(asset => (
                                        <option key={asset._id} value={asset._id}>
                                            {asset.name} ({asset.serial})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Notes</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/25"
                                >
                                    Assign Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
