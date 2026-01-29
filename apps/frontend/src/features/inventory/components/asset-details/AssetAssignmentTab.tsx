import { useState, useEffect } from 'react';
import { Asset } from "@/services/assetService";
import { AssetAssignmentHistoryTable } from '@/features/inventory/components/assignments/AssetAssignmentHistoryTable';
import { assignmentService, Assignment } from '@/services/assignmentService';

interface AssetAssignmentTabProps {
    asset: Asset;
}

export function AssetAssignmentTab({ asset }: AssetAssignmentTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                // In a real app we pass asset.id. For mock, we just get all or filter mock
                const data = await assignmentService.getByAssetId(asset.id || '1');
                setAssignments(data);
            } catch (error) {
                console.error("Failed to fetch assignments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [asset.id]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Assignment History</h3>
            </div>

            {loading ? (
                <div className="text-text-secondary">Loading history...</div>
            ) : (
                <AssetAssignmentHistoryTable assignments={assignments} />
            )}
        </div>
    );
}
