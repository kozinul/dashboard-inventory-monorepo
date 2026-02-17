import React from 'react';

interface ReportPreviewTableProps {
    data: any[];
    headers: string[];
    isLoading: boolean;
}

export const ReportPreviewTable: React.FC<ReportPreviewTableProps> = ({ data, headers, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                <p>No data found for the selected filters.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-border-dark">
                <thead className="bg-slate-50 dark:bg-background-dark">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-card-dark divide-y divide-slate-200 dark:divide-border-dark text-sm">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-background-dark transition-colors">
                            {Object.values(row).map((val: any, i) => (
                                <td key={i} className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                    {val}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
