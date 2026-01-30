import { useState, useEffect } from 'react';
import { vendorService, Vendor } from '@/services/vendorService';
import { VendorTable } from '@/features/vendors/components/VendorTable';
import { AddVendorModal, EditVendorModal } from '@/features/vendors/components/VendorModals';

export default function VendorManagementPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editVendor, setEditVendor] = useState<Vendor | null>(null);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const data = await vendorService.getAll();
            setVendors(data);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleAddVendor = async (data: Omit<Vendor, '_id' | 'status'>) => {
        try {
            await vendorService.create({ ...data, status: 'active' });
            fetchVendors();
        } catch (error) {
            console.error("Failed to create vendor", error);
        }
    };

    const handleUpdateVendor = async (id: string, data: Partial<Vendor>) => {
        try {
            await vendorService.update(id, data);
            fetchVendors();
        } catch (error) {
            console.error("Failed to update vendor", error);
        }
    };

    const handleDeleteVendor = async (vendor: Vendor) => {
        if (confirm(`Are you sure you want to delete ${vendor.name}?`)) {
            try {
                await vendorService.delete(vendor._id);
                fetchVendors();
            } catch (error) {
                console.error("Failed to delete vendor", error);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vendor Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        Manage your suppliers and service providers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <VendorTable
                    vendors={vendors}
                    onEdit={(vendor) => setEditVendor(vendor)}
                    onDelete={handleDeleteVendor}
                />
            )}

            <AddVendorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddVendor}
            />

            <EditVendorModal
                isOpen={!!editVendor}
                onClose={() => setEditVendor(null)}
                onUpdate={handleUpdateVendor}
                vendor={editVendor}
            />
        </div>
    );
}
