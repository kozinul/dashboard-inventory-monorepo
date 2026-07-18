import { useState, useEffect } from 'react';
import {
    ArrowDownTrayIcon,
    TrashIcon,
    ArrowPathIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

interface Backup {
    filename: string;
    size: number;
    createdAt: string;
}

interface StockOpname {
    _id: string;
    title: string;
    status: string;
    type: string;
    createdAt: string;
    locationId?: { name: string };
    departmentId?: { name: string };
    createdBy?: { name: string };
}

export default function DatabaseManagement() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    // SO Cleanup
    const [soList, setSoList] = useState<StockOpname[]>([]);
    const [soLoading, setSoLoading] = useState(false);
    const [selectedSOs, setSelectedSOs] = useState<Set<string>>(new Set());

    // Wipe modal
    const [showWipeModal, setShowWipeModal] = useState(false);
    const [wipeSelections, setWipeSelections] = useState<Set<string>>(new Set());
    const [wipeStep, setWipeStep] = useState<'select' | 'confirm' | 'done'>('select');

    const API_URL = '/database';

    const WIPE_CATEGORIES = [
        { key: 'MaintenanceRecord', label: 'Maintenance Records', desc: 'All maintenance tickets' },
        { key: 'Transfer', label: 'Transfers', desc: 'All asset transfers' },
        { key: 'Disposal', label: 'Disposals', desc: 'All asset disposals' },
        { key: 'Assignment', label: 'Assignments', desc: 'All asset assignments' },
        { key: 'Rental', label: 'Rentals', desc: 'All rental transactions' },
        { key: 'Event', label: 'Events', desc: 'All event bookings' },
        { key: 'SupplyHistory', label: 'Supply History', desc: 'All supply usage history' },
        { key: 'Asset', label: 'Assets', desc: 'All asset data' },
        { key: 'Supply', label: 'Supplies', desc: 'All supply data' },
    ];

    const toggleWipeSelection = (key: string) => {
        setWipeSelections(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const openWipeModal = () => {
        setWipeSelections(new Set());
        setWipeStep('select');
        setShowWipeModal(true);
    };

    const handleWipeConfirm = async () => {
        const selected = Array.from(wipeSelections);
        setResetting(true);
        setWipeStep('done');
        try {
            const { data } = await axios.post(`${API_URL}/reset-transactions`, { collections: selected });
            Swal.fire({
                title: 'Wipe Complete!',
                html: `<div style="text-align:left">${data.details.map((d: string) => `<div>${d}</div>`).join('')}</div>`,
                icon: 'success'
            });
        } catch (error: any) {
            Swal.fire('Error!', error?.response?.data?.message || 'Failed to wipe data.', 'error');
        } finally {
            setResetting(false);
            setShowWipeModal(false);
        }
    };

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}`);
            setBackups(response.data.data);
        } catch (error) {
            console.error('Failed to fetch backups', error);
            // alert('Failed to fetch backups');
        } finally {
            setLoading(false);
        }
    };

    const createBackup = async () => {
        setCreating(true);
        try {
            await axios.post(`${API_URL}`);
            await fetchBackups();
            Swal.fire({ title: 'Success', text: 'Backup created successfully', icon: 'success' });
        } catch (error) {
            console.error('Failed to create backup', error);
            Swal.fire({ title: 'Error', text: 'Failed to create backup', icon: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const deleteBackup = async (filename: string) => {
        const result = await Swal.fire({
            title: 'Delete Backup?',
            text: `Are you sure you want to delete ${filename}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete'
        });

        if (!result.isConfirmed) return;

        setDeleting(filename);
        try {
            await axios.delete(`${API_URL}/${filename}`);
            await fetchBackups();
            Swal.fire({ title: 'Deleted!', text: 'Backup deleted.', icon: 'success' });
        } catch (error) {
            console.error('Failed to delete backup', error);
            Swal.fire({ title: 'Error', text: 'Failed to delete backup', icon: 'error' });
        } finally {
            setDeleting(null);
        }
    };

    const restoreBackup = async (filename: string) => {
        const result = await Swal.fire({
            title: 'Restore Database?',
            text: `Are you sure you want to restore from ${filename}? CURRENT DATA WILL BE LOST!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Restore it!'
        });

        if (!result.isConfirmed) return;

        // Show loading overlay
        Swal.fire({
            title: 'Restoring Data...',
            text: 'Please wait, this may take a moment.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setRestoring(filename);
        try {
            await axios.post(`${API_URL}/${filename}/restore`);
            Swal.fire({
                title: 'Restored!',
                text: 'Database and Images restored successfully.',
                icon: 'success'
            });
        } catch (error) {
            console.error('Failed to restore backup', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to restore backup. Please check your connection or file.',
                icon: 'error'
            });
        } finally {
            setRestoring(null);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('backupFile', file);

        setLoading(true); // Re-use loading state or create a new one
        try {
            await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            await fetchBackups();
            Swal.fire({ title: 'Success', text: 'Backup uploaded successfully', icon: 'success' });
        } catch (error) {
            console.error('Failed to upload backup', error);
            Swal.fire({ title: 'Error', text: 'Failed to upload backup', icon: 'error' });
        } finally {
            setLoading(false);
            // Reset input
            event.target.value = '';
        }
    };

    // --- SO Cleanup ---
    const fetchStockOpnames = async () => {
        setSoLoading(true);
        try {
            const res = await axios.get('/stock-opname');
            setSoList(res.data);
        } catch {
            // silently fail
        } finally {
            setSoLoading(false);
        }
    };

    const toggleSelectSO = (id: string) => {
        setSelectedSOs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllSO = () => {
        if (selectedSOs.size === soList.length) {
            setSelectedSOs(new Set());
        } else {
            setSelectedSOs(new Set(soList.map(s => s._id)));
        }
    };

    const handleDeleteSelectedSO = async () => {
        if (selectedSOs.size === 0) return;
        const result = await Swal.fire({
            title: 'Delete Selected Stock Opname?',
            text: `This will delete ${selectedSOs.size} Stock Opname record(s) and all their items. This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!'
        });
        if (!result.isConfirmed) return;
        try {
            await axios.post('/stock-opname/cleanup', { ids: Array.from(selectedSOs) });
            Swal.fire({ title: 'Deleted!', text: 'Selected Stock Opname data deleted.', icon: 'success' });
            setSelectedSOs(new Set());
            fetchStockOpnames();
        } catch {
            Swal.fire({ title: 'Error', text: 'Failed to delete selected Stock Opname data.', icon: 'error' });
        }
    };

    const handleDeleteAllSO = async () => {
        const result = await Swal.fire({
            title: 'Delete ALL Stock Opname Data?',
            text: 'This will permanently delete ALL Stock Opname records and items. This cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete ALL!'
        });
        if (!result.isConfirmed) return;
        try {
            const res = await axios.post('/stock-opname/cleanup');
            Swal.fire({
                title: 'Cleaned!',
                text: res.data.message || 'All Stock Opname data deleted.',
                icon: 'success'
            });
            setSelectedSOs(new Set());
            fetchStockOpnames();
        } catch {
            Swal.fire({ title: 'Error', text: 'Failed to clean Stock Opname data.', icon: 'error' });
        }
    };

    const downloadBackup = async (filename: string) => {
        try {
            const response = await axios.get(`${API_URL}/${filename}/download`, {
                responseType: 'blob', // Important for downloading files
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download backup', error);
            Swal.fire({ title: 'Error', text: 'Failed to download backup', icon: 'error' });
        }
    };

    useEffect(() => {
        fetchBackups();
        fetchStockOpnames();
    }, []);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <>
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center justify-between">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Database Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage backups or reset transactional data for production readiness.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
                    <button
                        type="button"
                        onClick={openWipeModal}
                        disabled={resetting}
                        className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                    >
                        {resetting ? 'Wiping...' : (
                            <span className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                Wipe Transactions
                            </span>
                        )}
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            id="upload-backup"
                            className="hidden"
                            accept=".json,.zip"
                            onChange={handleUpload}
                        />
                        <label
                            htmlFor="upload-backup"
                            className="flex items-center gap-2 cursor-pointer bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-gray-50"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 transform rotate-180" />
                            Upload Backup
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={createBackup}
                        disabled={creating}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {creating ? 'Creating...' : (
                            <span className="flex items-center gap-2">
                                <PlusIcon className="h-5 w-5" />
                                Create Backup
                            </span>
                        )}
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Filename
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Size
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Created At
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                                                Loading backups...
                                            </td>
                                        </tr>
                                    ) : backups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                                                No backups found.
                                            </td>
                                        </tr>
                                    ) : (
                                        backups.map((backup) => (
                                            <tr key={backup.filename}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {backup.filename}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {formatBytes(backup.size)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(backup.createdAt).toLocaleString()}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => restoreBackup(backup.filename)}
                                                            disabled={restoring === backup.filename}
                                                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                                            title="Restore"
                                                        >
                                                            <ArrowPathIcon className={`h-5 w-5 ${restoring === backup.filename ? 'animate-spin' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => downloadBackup(backup.filename)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Download"
                                                        >
                                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBackup(backup.filename)}
                                                            disabled={deleting === backup.filename}
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
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
            </div>

            {/* Stock Opname Cleanup */}
            <div className="mt-10">
                <div className="sm:flex sm:items-center justify-between">
                    <div className="sm:flex-auto">
                        <h2 className="text-base font-semibold leading-6 text-gray-900">Stock Opname Cleanup</h2>
                        <p className="mt-2 text-sm text-gray-700">
                            Permanently delete Stock Opname records. Useful for resetting training/testing data.
                        </p>
                    </div>
                    <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
                        <button
                            type="button"
                            onClick={handleDeleteSelectedSO}
                            disabled={selectedSOs.size === 0}
                            className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50"
                        >
                            <span className="flex items-center gap-2">
                                <TrashIcon className="h-5 w-5" />
                                Delete Selected ({selectedSOs.size})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteAllSO}
                            className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                        >
                            <span className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                Delete All
                            </span>
                        </button>
                    </div>
                </div>
                <div className="mt-4 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="relative w-8 px-3 sm:pl-6">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                    checked={selectedSOs.size === soList.length && soList.length > 0}
                                                    onChange={toggleSelectAllSO}
                                                />
                                            </th>
                                            <th scope="col" className="py-3.5 pl-2 pr-3 text-left text-sm font-semibold text-gray-900">Title</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {soLoading ? (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-sm text-gray-500">Loading...</td>
                                            </tr>
                                        ) : soList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-4 text-center text-sm text-gray-500">No Stock Opname records found.</td>
                                            </tr>
                                        ) : (
                                            soList.map(so => (
                                                <tr key={so._id} className="hover:bg-gray-50">
                                                    <td className="relative w-8 px-3 py-4 sm:pl-6">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                            checked={selectedSOs.has(so._id)}
                                                            onChange={() => toggleSelectSO(so._id)}
                                                        />
                                                    </td>
                                                    <td className="whitespace-nowrap py-4 pl-2 pr-3 text-sm font-medium text-gray-900">{so.title}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{so.type}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                            so.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                            so.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                                                            so.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                                            so.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {so.status}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {new Date(so.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {showWipeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {wipeStep === 'select' ? 'Select Data to Wipe' : 'Confirm Wipe'}
                        </h3>
                        <button onClick={() => setShowWipeModal(false)} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        {wipeStep === 'select' && (
                            <>
                                <p className="text-sm text-gray-500 mb-4">Check the collections you want to permanently delete:</p>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {WIPE_CATEGORIES.map(cat => (
                                        <label
                                            key={cat.key}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                wipeSelections.has(cat.key)
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={wipeSelections.has(cat.key)}
                                                onChange={() => toggleWipeSelection(cat.key)}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{cat.label}</div>
                                                <div className="text-xs text-gray-500">{cat.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}

                        {wipeStep === 'confirm' && (
                            <div>
                                <p className="text-sm text-red-600 font-medium mb-3">
                                    You are about to permanently delete:
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {Array.from(wipeSelections).map(key => {
                                        const cat = WIPE_CATEGORIES.find(c => c.key === key);
                                        return <li key={key}>{cat?.label}</li>;
                                    })}
                                </ul>
                                <p className="text-sm text-gray-500 mt-4">This action cannot be undone.</p>
                            </div>
                        )}

                        {wipeStep === 'done' && (
                            <div className="text-center py-4">
                                <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                                <p className="text-sm text-gray-600">Wiping selected data...</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t px-6 py-4">
                        <button
                            onClick={() => setShowWipeModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        {wipeStep === 'select' && (
                            <button
                                onClick={() => wipeSelections.size > 0 && setWipeStep('confirm')}
                                disabled={wipeSelections.size === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                Continue ({wipeSelections.size} selected)
                            </button>
                        )}
                        {wipeStep === 'confirm' && (
                            <button
                                onClick={handleWipeConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                Yes, Wipe Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
