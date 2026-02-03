import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplyService, Supply } from '../../../services/supplyService';
import { AddSupplyModal } from '../components/supplies/AddSupplyModal';
import { EditSupplyModal } from '../components/supplies/EditSupplyModal';
import Swal from 'sweetalert2';

export default function SuppliesPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSupplies = async () => {
        setLoading(true);
        try {
            const data = await supplyService.getAll({ search: searchTerm });
            setSupplies(data);
        } catch (error) {
            console.error('Error fetching supplies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplies();
    }, [searchTerm]);

    const handleAdd = () => {
        setIsAddModalOpen(true);
    };

    const handleEdit = (supply: Supply) => {
        setSelectedSupply(supply);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await supplyService.delete(id);
                fetchSupplies();
                Swal.fire('Deleted!', 'Supply item has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting supply:', error);
                Swal.fire('Error!', 'Failed to delete item.', 'error');
            }
        }
    };



    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Supplies & Stock</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        Manage consumables, accessories, and spare parts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Search supplies..."
                            className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-4 py-2 text-sm font-medium focus:ring-primary focus:border-primary w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        New Supply
                    </button>
                </div>
            </div>

            {/* Modal */}
            <AddSupplyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={fetchSupplies}
            />

            <EditSupplyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={fetchSupplies}
                supply={selectedSupply}
            />

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Item Info</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Department</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cost</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : supplies.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                                            <p>No supplies found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                supplies.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <Link to={`/inventory/supplies/${item._id}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors">
                                                    {item.name}
                                                </Link>
                                                <p className="text-[11px] text-slate-500 font-mono">P/N: {item.partNumber}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {/* @ts-ignore */}
                                                {item.unitId?.symbol || item.unitId?.name || item.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${item.quantity < item.minimumStock ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {item.quantity}
                                                </span>
                                                {item.quantity < item.minimumStock && (
                                                    <div title="Low Stock" className="text-red-500 animate-pulse">
                                                        <span className="material-symbols-outlined text-[18px]">warning</span>
                                                    </div>
                                                )}
                                                <span className="text-xs text-slate-400">/ min {item.minimumStock}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {/* @ts-ignore - populated field */}
                                                {item.departmentId?.name || item.department?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                                {/* @ts-ignore - populated field */}
                                                <span className="text-sm">{item.locationId?.name || item.location || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                Rp {item.cost?.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id!)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
