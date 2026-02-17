import { useState, useEffect } from 'react';
import { auditLogService, AuditLog } from '@/services/auditLogService';
import { userService, User } from '@/services/userService';
import { format } from 'date-fns';
import {
    ClockIcon,
    UserIcon,
    TagIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        resourceType: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, filters.resourceType, filters.action, filters.userId, filters.startDate, filters.endDate]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditLogService.getLogs({
                page,
                limit: 50,
                resourceType: filters.resourceType || undefined,
                action: filters.action || undefined,
                userId: filters.userId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            });
            setLogs(data.data);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await auditLogService.exportLogs({
                resourceType: filters.resourceType || undefined,
                action: filters.action || undefined,
                userId: filters.userId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'update': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'delete': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'login': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'install': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'dismantle': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getResourceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'asset': return <TagIcon className="w-4 h-4" />;
            case 'user': return <UserIcon className="w-4 h-4" />;
            case 'location': return <span className="material-symbols-outlined !text-[16px]">location_on</span>;
            default: return <ClockIcon className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Trace system activities and user actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 text-slate-500 hover:text-primary transition-colors bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                        <ArrowPathIcon className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.resourceType}
                            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                        >
                            <option value="">All Resources</option>
                            <option value="Asset">Assets</option>
                            <option value="User">Users</option>
                            <option value="Location">Locations</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        >
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="install">Install</option>
                            <option value="dismantle">Dismantle</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase">Start</span>
                        <input
                            type="date"
                            className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 uppercase">End</span>
                        <input
                            type="date"
                            className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-primary dark:text-white"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button
                            onClick={() => setFilters({
                                resourceType: '',
                                action: '',
                                userId: '',
                                startDate: '',
                                endDate: '',
                                search: ''
                            })}
                            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">User</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Resource</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-slate-50/50 dark:bg-slate-800/50"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No activity logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {typeof log.userId === 'object' ? log.userId.name.charAt(0) : '?'}
                                                </div>
                                                <span className="text-sm font-medium dark:text-slate-200">
                                                    {typeof log.userId === 'object' ? log.userId.name : 'System'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight", getActionColor(log.action))}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                {getResourceIcon(log.resourceType)}
                                                <span className="font-medium text-slate-900 dark:text-slate-200">{log.resourceType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1" title={log.details}>
                                                {log.details}
                                                {log.resourceName && (
                                                    <span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">
                                                        ({log.resourceName})
                                                    </span>
                                                )}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Page {page} of {pagination.pages}
                        </span>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
