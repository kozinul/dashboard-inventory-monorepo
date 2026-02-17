import { useState, useEffect } from 'react';
import { ReportPreviewTable } from '@/features/reports/components/ReportPreviewTable';
import { ReportCard } from '@/features/reports/components/ReportCard';
import { importExportService, ExportOptions } from '@/services/importExportService';
import { branchService, Branch } from '@/services/branchService';
import { departmentService, Department } from '@/services/departmentService';
import { useAuthStore } from '@/store/authStore';

const REPORT_TYPES = [
    { id: 'asset', title: 'Asset Inventory', desc: 'Hardware, laptops, and equipment tracking', icon: 'inventory_2', color: 'bg-blue-500' },
    { id: 'supply', title: 'Supplies & Stock', desc: 'Consumables, office supplies, and spare parts', icon: 'layers', color: 'bg-emerald-500' },
    { id: 'maintenance', title: 'Maintenance History', desc: 'Recent repairs, tickets, and service history', icon: 'build', color: 'bg-orange-500' },
    { id: 'rental', title: 'Rental Reports', desc: 'Equipment lending and return records', icon: 'event_available', color: 'bg-purple-500' },
];

export default function ReportsPage() {
    const { user } = useAuthStore();
    const [reportType, setReportType] = useState<ExportOptions['type']>('asset');
    const [branchId, setBranchId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [status, setStatus] = useState('');
    const [maintenanceType, setMaintenanceType] = useState('');
    const [groupBy, setGroupBy] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const isSuperUser = user?.role === 'superuser';
    const isAdmin = user?.role === 'admin';
    const isTechnician = user?.role === 'technician';
    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (isSuperUser) {
            branchService.getAll().then(setBranches);
        } else if (user?.branchId) {
            setBranchId(user.branchId);
        }

        if (isManager || isTechnician) {
            if (user?.departmentId) setDepartmentId(user.departmentId);
        }

        departmentService.getAll().then(setDepartments);
    }, [isSuperUser, isAdmin, isManager, isTechnician, user]);

    const filteredDepartments = (isSuperUser || isAdmin || isTechnician || isManager) && branchId
        ? departments.filter(d => d.branchId === branchId)
        : departments;

    const handlePreview = async () => {
        setIsLoadingPreview(true);
        try {
            const result = await importExportService.previewData({
                type: reportType,
                branchId: branchId || undefined,
                departmentId: departmentId || undefined,
                status: status || undefined,
                maintenanceType: maintenanceType || undefined,
                groupBy: groupBy || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setPreviewData(result.data);
            if (result.data.length > 0) {
                setPreviewHeaders(Object.keys(result.data[0]));
            }
        } catch (error) {
            console.error('Failed to fetch preview', error);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            await importExportService.exportData({
                type: reportType,
                format,
                branchId: branchId || undefined,
                departmentId: departmentId || undefined,
                status: status || undefined,
                maintenanceType: maintenanceType || undefined,
                groupBy: groupBy || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
        } catch (error) {
            console.error('Export failed', error);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reporting Center</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">analytics</span>
                        Advanced reporting and analytics engine
                    </p>
                </div>
            </div>

            {/* Report Type Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {REPORT_TYPES.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => {
                            setReportType(type.id as any);
                            setPreviewData([]);
                        }}
                        className={`relative group h-full text-left p-5 rounded-3xl border-2 transition-all duration-300 ${reportType === type.id
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xl shadow-primary/10'
                            : 'border-slate-100 dark:border-border-dark bg-white dark:bg-card-dark hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        <div className={`h-12 w-12 rounded-2xl ${type.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{type.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{type.desc}</p>

                        {reportType === type.id && (
                            <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-4 border-white dark:border-card-dark">
                                <span className="material-symbols-outlined text-white text-[14px]">check</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-200 dark:border-border-dark shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20"></span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Report Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {isSuperUser && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Branch</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}

                    {(isAdmin || isTechnician || isManager) && (
                        <div className="space-y-1.5 opacity-60">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Branch</label>
                            <select
                                disabled
                                value={branchId}
                                className="w-full bg-slate-100 dark:bg-background-dark/50 border-none rounded-xl text-sm h-11 cursor-not-allowed"
                            >
                                <option value={branchId}>{branches.find(b => b._id === branchId)?.name || user?.branchId ? 'Your Branch' : 'Select Branch'}</option>
                            </select>
                        </div>
                    )}

                    {(isSuperUser || isAdmin) && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Department</label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                            >
                                <option value="">All Departments</option>
                                {filteredDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    {(isTechnician || isManager) && (
                        <div className="space-y-1.5 opacity-60">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Department</label>
                            <select
                                disabled
                                value={departmentId}
                                className="w-full bg-slate-100 dark:bg-background-dark/50 border-none rounded-xl text-sm h-11 cursor-not-allowed"
                            >
                                <option value={departmentId}>{departments.find(d => d._id === departmentId)?.name || 'Your Department'}</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                            {reportType === 'supply' ? 'Supply Action' : 'Status Filter'}
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                        >
                            <option value="">{reportType === 'supply' ? 'All Actions' : 'All Statuses'}</option>
                            {reportType === 'asset' && (
                                <>
                                    <option value="active">Active</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="disposed">Disposed</option>
                                </>
                            )}
                            {reportType === 'maintenance' && (
                                <>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </>
                            )}
                            {reportType === 'rental' && (
                                <>
                                    <option value="active">Active</option>
                                    <option value="returned">Returned</option>
                                    <option value="overdue">Overdue</option>
                                </>
                            )}
                            {reportType === 'supply' && (
                                <>
                                    <option value="USE">USE (Pemakaian)</option>
                                    <option value="RESTOCK">RESTOCK (Penambahan)</option>
                                    <option value="CREATE">CREATE (Initial)</option>
                                    <option value="UPDATE">UPDATE (Koreksi)</option>
                                </>
                            )}
                        </select>
                    </div>

                    {reportType === 'maintenance' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Maintenance Type</label>
                            <select
                                value={maintenanceType}
                                onChange={(e) => setMaintenanceType(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                            >
                                <option value="">All Types</option>
                                <option value="Routine">Routine</option>
                                <option value="Repair">Repair</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Group By</label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                        >
                            <option value="">No Grouping</option>
                            {reportType === 'asset' && (
                                <>
                                    <option value="category">Category</option>
                                    <option value="status">Status</option>
                                    <option value="branch">Branch</option>
                                    <option value="department">Department</option>
                                </>
                            )}
                            {reportType === 'maintenance' && (
                                <>
                                    <option value="asset">Asset</option>
                                    <option value="status">Status</option>
                                    <option value="type">Maintenance Type</option>
                                    <option value="branch">Branch</option>
                                </>
                            )}
                            {reportType === 'rental' && (
                                <>
                                    <option value="status">Status</option>
                                    <option value="user">User</option>
                                    <option value="event">Event</option>
                                </>
                            )}
                            {reportType === 'supply' && (
                                <>
                                    <option value="supply">Barang</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 h-11"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-border-dark">
                    <button
                        onClick={handlePreview}
                        disabled={isLoadingPreview}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                    >
                        {isLoadingPreview ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[18px]">search</span>
                        )}
                        Preview Data
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-2xl font-bold text-sm hover:brightness-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">table_chart</span>
                            Export Excel
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-2xl font-bold text-sm hover:brightness-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">article</span>
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Report Preview
                            {previewData.length > 0 && <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-background-dark px-2 py-1 rounded-md ml-2">{previewData.length} records</span>}
                        </h3>
                    </div>

                    <div className="flex items-center p-1 bg-slate-100 dark:bg-background-dark rounded-xl h-10">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 h-full flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            <span className="material-symbols-outlined text-sm">table_rows</span>
                            Tabel
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 h-full flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            <span className="material-symbols-outlined text-sm">grid_view</span>
                            Cards
                        </button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <ReportPreviewTable
                        data={previewData}
                        headers={previewHeaders}
                        isLoading={isLoadingPreview}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {isLoadingPreview ? (
                            <div className="col-span-full h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : previewData.length > 0 ? (
                            previewData.map((record, i) => (
                                <ReportCard key={i} data={record} type={reportType} />
                            ))
                        ) : (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined text-5xl mb-3">error_outline</span>
                                <p className="font-medium text-lg">No data matches your filters</p>
                                <p className="text-sm">Try adjusting your date range or scope</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
