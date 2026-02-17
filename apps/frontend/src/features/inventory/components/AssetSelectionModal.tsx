import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { assetService, Asset } from '@/services/assetService';
import { useAuthStore } from '@/store/authStore';
import { AssetTable } from './AssetTable';

interface AssetSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (assetId: string) => void;
    title?: string;
    branchId?: string;
    departmentId?: string;
}

export function AssetSelectionModal({
    isOpen,
    onClose,
    onSelect,
    title = "Select Asset to Install",
    branchId,
    departmentId
}: AssetSelectionModalProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { user } = useAuthStore();

    const fetchAvailableAssets = async () => {
        setLoading(true);
        try {
            // We want "Available" assets (status: active or storage)
            // Filter by department if user is not superuser/admin
            const params: any = {
                status: 'active',
                limit: 50,
                search: search || undefined,
                branchId: branchId || undefined,
                departmentId: departmentId || (user && !['superuser', 'admin'].includes(user.role) ? user.departmentId : undefined)
            };

            const response = await assetService.getAll(params);
            setAssets(response.data);
        } catch (error) {
            console.error("Failed to fetch available assets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAvailableAssets();
        }
    }, [isOpen]);

    // Handle search with debounce or just on enter/click
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAvailableAssets();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 dark:text-white">
                                        {title}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="rounded-full p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Search Bar */}
                                    <form onSubmit={handleSearch} className="mb-6 relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search by name, serial, or model..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                        />
                                        <button
                                            type="submit"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all"
                                        >
                                            Search
                                        </button>
                                    </form>

                                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                                <p className="text-sm text-slate-500">Fetching available assets...</p>
                                            </div>
                                        ) : assets.length > 0 ? (
                                            <AssetTable
                                                assets={assets}
                                                onSelect={(asset) => onSelect(asset.id || asset._id)}
                                                actionLabel="Install"
                                            />
                                        ) : (
                                            <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
                                                <p className="text-slate-500 text-sm">
                                                    {user && ['superuser', 'admin'].includes(user.role)
                                                        ? "No available assets found."
                                                        : "No available assets found in your department."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
