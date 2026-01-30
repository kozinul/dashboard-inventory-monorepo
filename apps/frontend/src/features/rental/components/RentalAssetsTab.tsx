import { useState, useEffect } from 'react';
import { rentalService, Rental } from '@/services/rentalService';
import { format } from 'date-fns';

export default function RentalAssetsTab() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const data = await rentalService.getAll();
            setRentals(data);
        } catch (error) {
            console.error('Failed to fetch rentals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    return (
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-[#F8FAFC] dark:bg-slate-900/50">
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <th scope="col" className="py-4 pl-6 pr-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Asset
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Assigned To
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Event
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Date Issued
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Expected Return
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                    <p className="mt-2 text-slate-400">Loading rentals...</p>
                                </td>
                            </tr>
                        ) : rentals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_return</span>
                                    <p>No active rentals found.</p>
                                </td>
                            </tr>
                        ) : (
                            rentals.map((rental) => (
                                <tr key={rental._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-bold text-slate-900 dark:text-white">
                                        {rental.assetId?.name || 'Unknown Asset'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {rental.userId ? `${rental.userId.firstName} ${rental.userId.lastName}` : 'Unknown User'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {rental.eventId?.name || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {format(new Date(rental.rentalDate), 'PP')}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {format(new Date(rental.expectedReturnDate), 'PP')}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${rental.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : rental.status === 'returned'
                                                ? 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
                                                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                            }`}>
                                            <span className={`size-1.5 rounded-full ${rental.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                                                rental.status === 'returned' ? 'bg-slate-400' : 'bg-rose-500'
                                                }`}></span>
                                            {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
