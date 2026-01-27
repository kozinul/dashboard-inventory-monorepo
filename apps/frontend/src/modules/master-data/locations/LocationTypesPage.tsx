import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { LocationType, locationTypeService } from '@/services/locationTypeService';
import { LocationTypeModal } from './components/LocationTypeModal';

export function LocationTypesPage() {
    const [types, setTypes] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<LocationType | null>(null);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await locationTypeService.getAll();
            setTypes(data);
        } catch (error) {
            console.error('Failed to fetch location types', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleAdd = () => {
        setEditingType(null);
        setIsModalOpen(true);
    };

    const handleEdit = (type: LocationType) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location type?')) return;
        try {
            await locationTypeService.delete(id);
            await fetchTypes();
        } catch (error) {
            console.error('Failed to delete location type', error);
            alert('Failed to delete location type');
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (editingType) {
                await locationTypeService.update(editingType._id, data);
            } else {
                await locationTypeService.create(data);
            }
            await fetchTypes();
        } catch (error) {
            console.error('Failed to save location type', error);
            throw error;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] -m-10 p-8 bg-background-dark text-white font-display overflow-hidden">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 h-full">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Location Types</h1>
                        <p className="text-text-secondary">Manage the types of locations available in the system.</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-accent-indigo hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Type
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-hidden bg-surface-dark rounded-xl border border-border-dark shadow-sm">
                    <div className="overflow-y-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-background-dark/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Level</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : types.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                                            No location types found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    types.map((type) => (
                                        <tr key={type._id} className="hover:bg-background-dark/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">
                                                {type.level}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                {type.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-normal text-sm text-text-secondary max-w-xs">
                                                {type.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(type)}
                                                        className="p-1.5 text-text-secondary hover:text-accent-indigo hover:bg-accent-indigo/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type._id)}
                                                        className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
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

            <LocationTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingType}
            />
        </div>
    );
}
