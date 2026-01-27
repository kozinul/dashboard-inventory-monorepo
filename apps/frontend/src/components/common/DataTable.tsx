import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string; // For custom width/alignment
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => ReactNode; // Edit/Delete buttons
}

function classNames(...classes: string[]) {
    return twMerge(clsx(classes));
}

export function DataTable<T extends { _id?: string; id?: string }>({
    data,
    columns,
    isLoading,
    onRowClick,
    actions
}: DataTableProps<T>) {

    if (isLoading) {
        return (
            <div className="w-full h-32 flex items-center justify-center bg-card rounded-lg border border-border">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 custom-scrollbar">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    {columns.map((column, index) => (
                                        <th
                                            key={index}
                                            scope="col"
                                            className={classNames(
                                                "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6",
                                                column.className || ""
                                            )}
                                        >
                                            {column.header}
                                        </th>
                                    ))}
                                    {actions && (
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-card">
                                {data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length + (actions ? 1 : 0)}
                                            className="py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No data found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, rowIdx) => (
                                        <tr
                                            key={item._id || item.id || rowIdx}
                                            onClick={() => onRowClick?.(item)}
                                            className={classNames(onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" : "")}
                                        >
                                            {columns.map((column, colIdx) => (
                                                <td
                                                    key={colIdx}
                                                    className={classNames(
                                                        "whitespace-nowrap py-4 pl-4 pr-3 text-sm text-foreground sm:pl-6",
                                                        column.className || ""
                                                    )}
                                                >
                                                    {column.cell
                                                        ? column.cell(item)
                                                        : column.accessorKey
                                                            ? String(item[column.accessorKey])
                                                            : null
                                                    }
                                                </td>
                                            ))}
                                            {actions && (
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    {actions(item)}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
