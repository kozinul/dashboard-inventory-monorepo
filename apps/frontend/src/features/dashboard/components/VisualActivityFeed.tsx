import { useEffect, useState } from 'react';
import { ActivityItem } from './ActivityItem';
import { dashboardService, RecentTicket } from '@/services/dashboardService';
import { Link } from 'react-router-dom';

export function VisualActivityFeed() {
    const [tickets, setTickets] = useState<RecentTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getRecentActivity();
                setTickets(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch recent tickets:', err);
                setError('Failed to load recent tickets');
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    return (
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white tracking-tight">Recent Visual Activity</h2>
                <Link to="/maintenance/my-tickets" className="text-sm font-semibold text-primary hover:underline">
                    View all tickets
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-card border border-slate-200 dark:border-slate-border rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
                        <p className="mt-2">Loading tickets...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-500">
                        <span className="material-symbols-outlined !text-[32px]">error</span>
                        <p className="mt-2">{error}</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <span className="material-symbols-outlined !text-[32px]">inbox</span>
                        <p className="mt-2">No recent tickets</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <ActivityItem key={ticket._id} ticket={ticket} />
                    ))
                )}
            </div>
        </div>
    );
}
