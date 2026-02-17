import React from 'react';

interface ReportCardProps {
    data: any;
    type: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({ data, type }) => {
    // Determine title and properties based on report type
    const title = data['Nama'] || data['No Tiket'] || data['Aset'] || 'Record';

    // Extract key details to show prominently
    const status = data['Status'];
    const subTitle = data['Model'] || data['Kategori'] || data['Peminjam'] || '';

    // Filter out some common fields for the body entries
    const bodyFields = Object.entries(data).filter(([key]) =>
        !['Nama', 'No Tiket', 'Aset', 'Status', 'Model', 'Kategori'].includes(key)
    );

    return (
        <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-border-dark p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'active' || status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        status === 'assigned' || status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {status}
                </span>
            </div>

            <div className="flex items-start gap-3 mt-1">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-xl">
                        {type === 'asset' ? 'inventory_2' :
                            type === 'supply' ? 'layers' :
                                type === 'maintenance' ? 'build' : 'event_available'}
                    </span>
                </div>
                <div className="min-w-0 pr-12">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subTitle}</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-y-3 gap-x-2 border-t border-slate-50 dark:border-border-dark pt-4">
                {bodyFields.slice(0, 4).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{key}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{String(val || 'N/A')}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-end">
                <button className="text-[10px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    VIEW DETAILS
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
};
