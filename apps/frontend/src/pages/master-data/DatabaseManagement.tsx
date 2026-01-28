import { useState, useEffect } from 'react';
import {
    ArrowDownTrayIcon,
    TrashIcon,
    ArrowPathIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/database`);
            setBackups(response.data.data);
        } catch (error) {
            console.error('Failed to fetch backups', error);
            alert('Failed to fetch backups');
        } finally {
            setLoading(false);
        }
    };

    const createBackup = async () => {
        setCreating(true);
        try {
            await axios.post(`${API_URL}/database`);
            await fetchBackups();
            alert('Backup created successfully');
        } catch (error) {
            console.error('Failed to create backup', error);
            alert('Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const deleteBackup = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete backup ${filename}?`)) return;

        setDeleting(filename);
        try {
            await axios.delete(`${API_URL}/database/${filename}`);
            await fetchBackups();
        } catch (error) {
            console.error('Failed to delete backup', error);
            alert('Failed to delete backup');
        } finally {
            setDeleting(null);
        }
    };

    const restoreBackup = async (filename: string) => {
        if (!confirm(`Are you sure you want to restore database from ${filename}? THIS WILL OVERWRITE CURRENT DATA!`)) return;

        setRestoring(filename);
        try {
            await axios.post(`${API_URL}/database/${filename}/restore`);
            alert('Database restored successfully');
        } catch (error) {
            console.error('Failed to restore backup', error);
            alert('Failed to restore backup');
        } finally {
            setRestoring(null);
        }
    };

    const downloadBackup = (filename: string) => {
        window.open(`${API_URL}/database/${filename}/download`, '_blank');
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
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Database Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage database backups. Create new backups, restore from existing ones, or download backup files.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
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
