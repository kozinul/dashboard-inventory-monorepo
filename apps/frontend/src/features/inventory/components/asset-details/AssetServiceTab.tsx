import { useState, useEffect } from "react";
import { Asset } from "@/services/assetService";
import { maintenanceService } from "@/services/maintenanceService";
import { ServiceTable } from "@/features/service/components/ServiceTable";

interface AssetServiceTabProps {
    asset: Asset;
}

export function AssetServiceTab({ asset }: AssetServiceTabProps) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        if (!asset?._id && !asset?.id) return;
        setLoading(true);
        try {
            // Support both _id and id
            const assetId = asset._id || asset.id;
            const data = await maintenanceService.getAll({
                serviceProviderType: 'Vendor',
                asset: assetId
            });
            setRecords(data);
        } catch (error) {
            console.error('Failed to fetch service records', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [asset]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">External Service History</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">History of vendor repairs and off-site services.</p>
                </div>
            </div>

            <ServiceTable
                records={records}
                loading={loading}
            />
        </div>
    );
}
