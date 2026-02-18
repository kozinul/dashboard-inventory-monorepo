import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { format } from 'date-fns';
import { AssetStatusBadge } from '@/features/inventory/components/AssetTableParts';

export default function MyAssetsPage() {
    const { user } = useAuthStore();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyAssets = async () => {
            if (user?._id) { // Use _id as per authStore definition
                try {
                    const data = await assignmentService.getUserAssignments(user._id);
                    // Filter for only active assignments if needed, currently showing history too might be confusing
                    // Let's show all but highlight active
                    setAssignments(data);
                } catch (error) {
                    console.error("Failed to fetch my assets", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMyAssets();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const activeAssignments = assignments.filter(a => a.status === 'assigned' && a.assetId);
    const pastAssignments = assignments.filter(a => a.status !== 'assigned' && a.assetId);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Assets</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Assets currently assigned to you</p>
            </div>

            {/* Active Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAssignments.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
                        <p className="text-slate-500 dark:text-slate-400">No assets currently assigned to you.</p>
                    </div>
                ) : (
                    activeAssignments.map((assignment) => (
                        <div key={assignment._id} className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-1 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 py-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Assigned {format(new Date(assignment.assignedDate), 'dd MMM yyyy')}
                                </span>
                                <AssetStatusBadge status={assignment.assetId?.status || 'unknown'} />
                            </div>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{assignment.assetId?.name || 'Deleted Asset'}</h3>
                                        <p className="text-sm text-slate-500 font-mono">{assignment.assetId?.serial || '-'}</p>
                                    </div>
                                    {(assignment.assetId as any).imageUrl && (
                                        <img
                                            src={(assignment.assetId as any).imageUrl}
                                            alt={assignment.assetId?.name || 'Asset'}
                                            className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <span>Category:</span>
                                        <span className="font-medium">{assignment.assetId?.category || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Model:</span>
                                        <span className="font-medium">{assignment.assetId?.model || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* History Section */}
            {pastAssignments.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Assessment History</h2>
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-500">Asset</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Assigned Date</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Returned Date</th>
                                    <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pastAssignments.map(assignment => (
                                    <tr key={assignment._id}>
                                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                                            {assignment.assetId?.name || 'Deleted Asset'} <span className="text-slate-400 font-normal">({assignment.assetId?.serial || '-'})</span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">
                                            {format(new Date(assignment.assignedDate), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">
                                            {assignment.returnedDate ? format(new Date(assignment.returnedDate), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${assignment.status === 'returned' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
