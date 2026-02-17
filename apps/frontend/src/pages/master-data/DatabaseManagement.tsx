import { useState, useEffect } from 'react';
import {
    ArrowDownTrayIcon,
    TrashIcon,
    ArrowPathIcon,
    PlusIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

interface Backup {
    filename: string;
    size: number;
    createdAt: string;
}

export default function DatabaseManagement() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const API_URL = '/database';

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

        setRestoring(filename);
        try {
            await axios.post(`${API_URL}/${filename}/restore`);
            Swal.fire({ title: 'Restored!', text: 'Database restored successfully.', icon: 'success' });
        } catch (error) {
            console.error('Failed to restore backup', error);
            Swal.fire({ title: 'Error', text: 'Failed to restore backup', icon: 'error' });
        } finally {
            setRestoring(null);
        }
    };

    const handleResetTransactions = async () => {
        const result = await Swal.fire({
            title: 'Reset All Transactions?',
            text: "This will DELETE ALL Maintenance Records, Transfers, Assignments, Disposals, and history! Only Master Data (Users, Assets, Locations, etc.) will remain. This action CANNOT be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, WIPE IT ALL!'
        });

        if (result.isConfirmed) {
            setResetting(true);
            try {
                await axios.delete(`${API_URL}/reset-transactions`);
                Swal.fire(
                    'Reset Complete!',
                    'All transactional data has been wiped. Assets are reset.',
                    'success'
                );
            } catch (error) {
                console.error('Failed to reset transactions', error);
                Swal.fire(
                    'Error!',
                    'Failed to reset data.',
                    'error'
                );
            } finally {
                setResetting(false);
            }
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

    const downloadBackup = (filename: string) => {
        window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}${API_URL}/${filename}/download`, '_blank');
    };

    useEffect(() => {
        fetchBackups();
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
                        onClick={handleResetTransactions}
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
                            accept=".json"
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
        </div>
    );
}
