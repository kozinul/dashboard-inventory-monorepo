import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStockOpnameDetail, startStockOpname, verifyStockOpnameItem, setOpnameToReview, reopenStockOpname, completeStockOpname, exportStockOpnameExcel, importStockOpnameExcel } from '@/features/inventory/api/stockOpname.api';
import { useAuthStore } from '@/store/authStore';
import { showSuccess, showError, showConfirmDialog, showLoading, closeAlert } from '@/utils/swal';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { locationService } from '@/services/locationService';

export default function StockOpnameDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [so, setSO] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [allLocations, setAllLocations] = useState<any[]>([]);

    useEffect(() => {
        locationService.getAll().then(setAllLocations).catch(() => {});
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getStockOpnameDetail(id!);
            setSO(data.so);
            setItems(data.items);
        } catch (error) {
            console.error('Failed to fetch SO detail', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleStart = async () => {
        const result = await showConfirmDialog(
            'Start Stock Opname?',
            'This will lock the current system quantities and generate the counting items. Continue?',
            'Yes, Start'
        );
        if (!result.isConfirmed) return;

        showLoading('Starting...', 'Generating stock opname items...');
        try {
            await startStockOpname(id!);
            closeAlert();
            showSuccess('Started!', 'Stock Opname is now ongoing.');
            fetchData();
        } catch (error) {
            closeAlert();
            showError('Failed to Start', (error as any).response?.data?.message || 'Something went wrong.');
        }
    };

    const handleUpdateItem = async (itemId: string, updates: any) => {
        try {
            await verifyStockOpnameItem(itemId, updates);
            setItems(prev => prev.map(item => {
                if (item._id === itemId) return { ...item, ...updates };
                return item;
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSetReview = async () => {
        const result = await showConfirmDialog(
            'Submit for Review?',
            'Once submitted, the data will be locked for final approval by management.',
            'Yes, Submit'
        );
        if (!result.isConfirmed) return;

        showLoading('Submitting...', 'Moving Stock Opname to review...');
        try {
            await setOpnameToReview(id!);
            closeAlert();
            showSuccess('Submitted for Review!', 'Awaiting management approval.');
            fetchData();
        } catch (error) {
            closeAlert();
            showError('Failed to Submit', (error as any).response?.data?.message || 'Something went wrong.');
        }
    };

    const handleReopen = async () => {
        const result = await showConfirmDialog(
            'Return to Ongoing?',
            'This will allow editing the physical counts again. The data will need to be re-submitted for review.',
            'Yes, Reopen'
        );
        if (!result.isConfirmed) return;

        showLoading('Reopening...', 'Returning stock opname to ongoing...');
        try {
            await reopenStockOpname(id!);
            closeAlert();
            showSuccess('Reopened!', 'Stock Opname is back to ONGOING status. You can edit the counts.');
            fetchData();
        } catch (error) {
            closeAlert();
            showError('Failed to Reopen', (error as any).response?.data?.message || 'Something went wrong.');
        }
    };

    const handleComplete = async () => {
        const result = await showConfirmDialog(
            'Approve & Complete?',
            'This will AUTO ADJUST the master data based on discrepancies found during the audit. This action cannot be undone.',
            'Yes, Approve',
            'warning'
        );
        if (!result.isConfirmed) return;

        showLoading('Completing...', 'Adjusting master data...');
        try {
            await completeStockOpname(id!);
            closeAlert();
            showSuccess('Completed!', 'Stock Opname has been approved and master data adjusted.');
            fetchData();
        } catch (error) {
            closeAlert();
            showError('Failed to Complete', (error as any).response?.data?.message || 'Something went wrong.');
        }
    };

    const handleExport = () => {
        exportStockOpnameExcel(id!);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            showLoading('Importing...', 'Processing Excel file...');
            try {
                const result = await importStockOpnameExcel(id!, file);
                closeAlert();
                showSuccess('Import Completed!', `${result.updated} items updated, ${result.failed} failed.`);
                fetchData();
            } catch (err: any) {
                closeAlert();
                showError('Import Failed', err.response?.data?.message || 'Something went wrong.');
            }
        };
        input.click();
    };

    if (isLoading) return <div>Loading...</div>;
    if (!so) return <div>Stock Opname not found</div>;

    const canComplete = ['superuser', 'admin', 'system_admin', 'manager'].includes(user?.role || '');

    const getItemName = (item: any) => item.supplyId?.name || item.assetId?.name || 'Unknown';
    const getItemLocation = (item: any) => {
        const locId = item.supplyId?.locationId || item.assetId?.locationId;
        if (!locId) return '';
        const locIdStr = typeof locId === 'string' ? locId : locId._id;
        const path: string[] = [];
        let currentId = locIdStr;
        while (currentId) {
            const loc = allLocations.find(l => l._id === currentId);
            if (loc) {
                path.unshift(loc.name);
                currentId = loc.parentId ? (typeof loc.parentId === 'string' ? loc.parentId : loc.parentId._id) : null;
            } else break;
        }
        return path.join(' > ');
    };
    const getItemUser = (item: any) => {
        if (item.assignedUser?.name) return item.assignedUser.name;
        if (item.assignedUser?.username) return item.assignedUser.username;
        return '';
    };

    const groupedItems = items.reduce((acc: Record<string, any[]>, item) => {
        const name = getItemName(item);
        if (!acc[name]) acc[name] = [];
        acc[name].push(item);
        return acc;
    }, {});

    const sortedGroupNames = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-500 hover:text-slate-700 mb-2 flex items-center">
                        &larr; Back
                    </button>
                    <h2 className="text-2xl font-bold">{so.title}</h2>
                    <p className="text-slate-500 text-sm">Status: <span className="font-bold">{so.status}</span> | Branch: {so.branchId?.name}</p>
                </div>
                <div className="flex gap-2 items-end">
                    {so.status === 'DRAFT' && (
                        <button onClick={handleStart} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
                            Start Opname
                        </button>
                    )}
                    {so.status === 'ONGOING' && (
                        <button onClick={handleSetReview} className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700">
                            Submit for Review
                        </button>
                    )}
                    {so.status === 'REVIEW' && (
                        <>
                            <button onClick={handleReopen} className="px-4 py-2 bg-slate-500 text-white rounded font-bold hover:bg-slate-600">
                                Return to Ongoing
                            </button>
                            {canComplete && (
                                <button onClick={handleComplete} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">
                                    Approve & Complete
                                </button>
                            )}
                        </>
                    )}
                    {so.status !== 'DRAFT' && (
                        <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Export Excel
                        </button>
                    )}
                    {so.status === 'ONGOING' && (
                        <button onClick={handleImport} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                            Import Excel
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded shadow p-4">
                <table className="w-full text-left text-sm mt-4">
                    <thead>
                        <tr className="border-b">
                            <th className="pb-2 w-6"></th>
                            <th className="pb-2">Item Name</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Location</th>
                            <th className="pb-2">User</th>
                            <th className="pb-2 text-center">System Qty</th>
                            <th className="pb-2 text-center">Physical Qty / Found</th>
                            <th className="pb-2">Difference</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions / Input</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGroupNames.map(name => {
                            const group = groupedItems[name]!;
                            const isExpanded = expandedGroups.has(name);
                            const totalSystemQty = group.reduce((sum, item) => sum + (item.systemQuantity || 0), 0);
                            const totalPhysicalQty = group.reduce((sum, item) => sum + (item.physicalQuantity || 0), 0);
                            const totalDifference = group.reduce((sum, item) => sum + ((item as any).difference || 0), 0);
                            return (
                            <Fragment key={name}>
                                <tr
                                    className="bg-slate-100 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => toggleGroup(name)}
                                >
                                    <td className="px-2 py-2">
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-4 w-4 text-slate-500" />
                                        )}
                                    </td>
                                    <td colSpan={9} className="px-0 py-2 font-semibold text-sm text-slate-700 dark:text-slate-300">
                                        {name}
                                        <span className="ml-2 text-xs font-normal text-slate-400">
                                            {group.length} item{group.length > 1 ? 's' : ''}
                                            {group.length > 1 && ` | Total: ${totalSystemQty} sys / ${totalPhysicalQty} phys (${totalDifference >= 0 ? '+' : ''}${totalDifference} diff)`}
                                        </span>
                                    </td>
                                </tr>
                                {isExpanded && group.map(item => (
                                    <tr key={item._id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td></td>
                                        <td className="py-3">
                                            {getItemName(item)}
                                            <div className="text-xs text-slate-500">{item.supplyId ? 'PN: '+item.supplyId.partNumber : 'SN: '+item.assetId?.serial}</div>
                                        </td>
                                        <td>{item.supplyId ? 'Supply' : 'Asset'}</td>
                                        <td className="text-slate-600 dark:text-slate-400">
                                            {getItemLocation(item) || '-'}
                                        </td>
                                        <td className="text-slate-600 dark:text-slate-400">
                                            {getItemUser(item) || '-'}
                                        </td>
                                        <td className="text-center">{item.systemQuantity}</td>
                                        <td className="text-center">
                                            {so.status === 'ONGOING' ? (
                                                item.supplyId ? (
                                                    <input
                                                        type="number"
                                                        defaultValue={item.physicalQuantity}
                                                        onBlur={(e) => handleUpdateItem(item._id, { physicalQuantity: Number(e.target.value) })}
                                                        className="w-20 border rounded px-2 py-1 text-center"
                                                    />
                                                ) : (
                                                    item.supplyId ? (
                                                        <input
                                                            type="number"
                                                            defaultValue={item.physicalQuantity}
                                                            onBlur={(e) => handleUpdateItem(item._id, { physicalQuantity: Number(e.target.value) })}
                                                            className="w-20 border rounded px-2 py-1 text-center"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            defaultChecked={item.isAssetFound}
                                                            onChange={(e) => handleUpdateItem(item._id, { isAssetFound: e.target.checked })}
                                                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                        />
                                                    )
                                                )
                                            ) : (
                                                item.supplyId ? item.physicalQuantity : (item.isAssetFound ?
                                                    <span className="text-emerald-600 font-bold">&#10003;</span> :
                                                    <span className="text-red-500 font-bold">&#10007;</span>
                                                )
                                            )}
                                        </td>
                                        <td>{item.supplyId ? (item.physicalQuantity - item.systemQuantity) : (item.physicalQuantity - item.systemQuantity)}</td>
                                        <td>{item.status}</td>
                                        <td className="text-right">
                                        </td>
                                    </tr>
                                ))}
                            </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
