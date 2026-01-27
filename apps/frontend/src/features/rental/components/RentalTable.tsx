import { clsx } from 'clsx';
import { RentalItem } from '../data/mock-rentals';

interface RentalTableProps {
    rentals: RentalItem[];
}

export function RentalTable({ rentals }: RentalTableProps) {
    return (
        <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-border-dark">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Asset
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Assigned To
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Checked Out
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Due Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Status
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-border-dark bg-white dark:bg-card-dark">
                        {rentals.map((rental) => (
                            <tr key={rental.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <img
                                                className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-white/10"
                                                src={rental.image}
                                                alt=""
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{rental.assetName}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{rental.assetId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                            {rental.assignedTo.name.charAt(0)}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{rental.assignedTo.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{rental.assignedTo.department}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {rental.checkedOutDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {rental.dueDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span
                                        className={clsx(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                            rental.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
                                            rental.status === 'overdue' && 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
                                            rental.status === 'returned' && 'bg-slate-100 text-slate-800 dark:bg-slate-600/20 dark:text-slate-400'
                                        )}
                                    >
                                        {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
