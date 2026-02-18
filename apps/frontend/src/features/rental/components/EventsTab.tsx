import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService, Event } from '@/services/eventService';
import { format } from 'date-fns';

interface EventsTabProps {
    refreshTrigger?: number;
}

export default function EventsTab({ refreshTrigger = 0 }: EventsTabProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await eventService.getAll();
            setEvents(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [refreshTrigger]);

    const getStatusStyles = (event: Event) => {
        const now = new Date();
        const isOverdue = new Date(event.endTime) < now && event.status !== 'completed' && event.status !== 'cancelled';

        if (isOverdue) {
            return {
                bg: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
                dot: 'bg-rose-500',
                label: 'Overdue'
            };
        }

        switch (event.status) {
            case 'scheduled':
                return {
                    bg: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                    dot: 'bg-amber-500',
                    label: 'Scheduled'
                };
            case 'ongoing':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                    dot: 'bg-emerald-500 animate-pulse',
                    label: 'Ongoing'
                };
            case 'planning':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
                    dot: 'bg-blue-500',
                    label: 'Planning'
                };
            case 'completed':
                return {
                    bg: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
                    dot: 'bg-slate-400',
                    label: 'Completed'
                };
            default:
                return {
                    bg: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
                    dot: 'bg-rose-500',
                    label: event.status.charAt(0).toUpperCase() + event.status.slice(1)
                };
        }
    };

    return (
        <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-[#F8FAFC] dark:bg-slate-900/50">
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <th scope="col" className="py-4 pl-6 pr-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Event Name
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Room
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Date
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                Start
                            </th>
                            <th scope="col" className="px-3 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-[#64748B] dark:text-slate-400">
                                End
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
                                    <p className="mt-2 text-slate-400">Loading events...</p>
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                                    <p>No events found.</p>
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => {
                                const styles = getStatusStyles(event);
                                return (
                                    <tr key={event._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-bold text-slate-900 dark:text-white">
                                            <Link to={`/events/${event._id}`} className="hover:text-primary transition-colors">
                                                {event.name}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {event.room}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {format(new Date(event.startTime), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {format(new Date(event.startTime), 'HH:mm')}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {format(new Date(event.endTime), 'HH:mm')}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles.bg}`}>
                                                <span className={`size-1.5 rounded-full ${styles.dot}`}></span>
                                                {styles.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
