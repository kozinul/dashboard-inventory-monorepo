
import { useState, useEffect } from 'react';
import { eventService, Event } from '@/services/eventService';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BookingHistoryTableProps {
    assetId: string;
}

export default function BookingHistoryTable({ assetId }: BookingHistoryTableProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const data = await eventService.getByAsset(assetId);
                setEvents(data);
            } catch (error) {
                console.error('Failed to fetch asset history:', error);
            } finally {
                setLoading(false);
            }
        };

        if (assetId) {
            fetchHistory();
        }
    }, [assetId]);

    if (loading) {
        return <div className="p-4 text-center text-slate-500">Loading history...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">history_edu</span>
                <p className="text-slate-500 dark:text-slate-400">No rental history found for this asset.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-card-dark">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6">Event</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Date</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-transparent">
                    {events.map((event) => (
                        <tr key={event._id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-white sm:pl-6">
                                <Link to={`/events/${event._id}`} className="hover:text-primary transition-colors">
                                    {event.name}
                                </Link>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                {format(new Date(event.startTime), 'PP')} - {format(new Date(event.endTime), 'PP')}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium md:mt-2 lg:mt-0 ${event.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                                    : event.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                                        : event.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400'
                                            : event.status === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                                    }`}>
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                {(() => {
                                    const rentedAsset = event.rentedAssets?.find(ra =>
                                        // Need to handle populated object or string ID
                                        typeof ra.assetId === 'string' ? ra.assetId === assetId : ra.assetId._id === assetId
                                    );
                                    return rentedAsset ? `Rp. ${rentedAsset.rentalRate.toLocaleString('id-ID')} / ${rentedAsset.rentalRateUnit}` : '-';
                                })()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
