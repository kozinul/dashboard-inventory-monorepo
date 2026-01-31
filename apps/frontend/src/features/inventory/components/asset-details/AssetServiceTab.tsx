import { useState, useEffect } from "react";
import { Asset } from "@/services/assetService";
import { maintenanceService } from "@/services/maintenanceService";
import { ServiceTable } from "@/features/service/components/ServiceTable";
import { ServiceModal } from "@/features/service/components/ServiceModal";

interface AssetServiceTabProps {
    asset: Asset;
}

export function AssetServiceTab({ asset }: AssetServiceTabProps) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

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

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service record?')) return;
        try {
            await maintenanceService.delete(id);
            fetchRecords();
        } catch (error) {
            console.error('Failed to delete record', error);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await maintenanceService.update(id, { status });
            fetchRecords();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">External Service History</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">History of vendor repairs and off-site services.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Register Service
                </button>
            </div>

            <ServiceTable
                records={records}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
            />

            <ServiceModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={fetchRecords}
                editData={editingRecord}
            />
        </div>
    );
}
