import { Vendor } from "@/services/vendorService";

interface VendorTableProps {
    vendors: Vendor[];
    onEdit: (vendor: Vendor) => void;
    onDelete: (vendor: Vendor) => void;
}

export function VendorTable({ vendors, onEdit, onDelete }: VendorTableProps) {
    return (
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-[#21213e]/50 border-b border-slate-200 dark:border-border-dark">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest">Vendor Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest">Contact Person</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest">Contact Info</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest">Website</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-text-secondary uppercase tracking-widest text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                    {vendors.length > 0 ? (
                        vendors.map((vendor) => (
                            <tr key={vendor._id} className="table-row-hover transition-colors even:bg-slate-50/50 dark:even:bg-transparent">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-lg">storefront</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{vendor.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-text-secondary">
                                    {vendor.contactName || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        {vendor.email && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-text-secondary">
                                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                                {vendor.email}
                                            </div>
                                        )}
                                        {vendor.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-text-secondary">
                                                <span className="material-symbols-outlined text-[14px]">call</span>
                                                {vendor.phone}
                                            </div>
                                        )}
                                        {!vendor.email && !vendor.phone && <span className="text-sm text-slate-400">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {vendor.website ? (
                                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline hover:text-primary-light flex items-center gap-1">
                                            Link
                                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                        </a>
                                    ) : (
                                        <span className="text-sm text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${vendor.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20'
                                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-500 dark:border-slate-500/20'
                                        }`}>
                                        {vendor.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(vendor)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(vendor)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">store_off</span>
                                    <p>No vendors found</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
