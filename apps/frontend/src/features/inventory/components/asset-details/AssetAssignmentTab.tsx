import { useState, useEffect } from 'react';
import { Asset } from "@/services/assetService";
import { AssetAssignmentHistoryTable } from '@/features/inventory/components/assignments/AssetAssignmentHistoryTable';
import { assignmentService, Assignment } from '@/services/assignmentService';

interface AssetAssignmentTabProps {
    asset: Asset;
}

import { showSuccessToast, showErrorToast } from "@/utils/swal";

// ... existing code ...

export function AssetAssignmentTab({ asset }: AssetAssignmentTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            // Use _id for backend calls
            const assetId = asset._id || asset.id;
            if (!assetId) return;

            const data = await assignmentService.getAssetHistory(assetId);
            setAssignments(data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (asset._id || asset.id) {
            fetchAssignments();
        }
    }, [asset._id, asset.id]);

    const handleReturnAsset = async (assignmentId: string) => {
        try {
            await assignmentService.returnAsset(assignmentId, {
                returnedDate: new Date(),
                notes: 'Returned via UI'
            });
            showSuccessToast('Asset returned successfully');
            fetchAssignments(); // Refresh list to show updated status
        } catch (error) {
            console.error("Failed to return asset", error);
            showErrorToast('Failed to return asset');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Assignment History</h3>
            </div>

            {loading ? (
                <div className="text-text-secondary">Loading history...</div>
            ) : (
                <AssetAssignmentHistoryTable
                    assignments={assignments}
                    onReturn={handleReturnAsset}
                />
            )}
        </div>
    );
}
