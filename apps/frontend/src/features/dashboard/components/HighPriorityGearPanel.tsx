import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { SystemInfoCard } from './SystemInfoCard';
import { eventService, Event } from '@/services/eventService';
import { Card } from '@/components/common/Card/Card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

export function HighPriorityGearPanel() {
    const { activeBranchId } = useAppStore();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const data = await eventService.getAll(activeBranchId);

                const now = new Date();
                const upcoming = data
                    .filter((e: Event) => {
                        const isNotDone = e.status !== 'cancelled' && e.status !== 'completed';
                        const isFuture = new Date(e.endTime) >= now;
                        // Include if it's in the future OR if it's still marked scheduled/ongoing (overdue)
                        return isNotDone && (isFuture || e.status === 'scheduled' || e.status === 'ongoing');
                    })
                    .sort((a: Event, b: Event) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5); // Show top 5
                setEvents(upcoming);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [activeBranchId]);

    const getStatusStyles = (event: Event) => {
        const now = new Date();
        const isOverdue = new Date(event.endTime) < now && event.status !== 'completed' && event.status !== 'cancelled';

        if (isOverdue) {
            return {
                classes: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
                label: 'Overdue'
            };
        }

        switch (event.status) {
            case 'scheduled': return {
                classes: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
                label: 'Scheduled'
            };
            case 'ongoing': return {
                classes: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
                label: 'Ongoing'
            };
            case 'planning': return {
                classes: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
                label: 'Planning'
            };
            case 'completed': return {
                classes: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-500/20',
                label: 'Completed'
            };
            default: return {
                classes: 'text-slate-600 bg-slate-50 border-slate-100',
                label: event.status
            };
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold dark:text-white tracking-tight">Upcoming Events</h2>
                    <Link to="/rental" className="text-xs font-medium text-primary hover:underline">View All</Link>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            No upcoming events found
                        </div>
                    ) : (
                        events.map((event) => (
                            <Link key={event._id} to={`/events/${event._id}`} className="block">
                                <Card padding="sm" className="group hover:border-primary/50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                {event.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {format(new Date(event.startTime), 'MMM d, HH:mm')} • {event.room}
                                            </p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const styles = getStatusStyles(event);
                                        return (
                                            <div className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                                                styles.classes
                                            )}>
                                                <span className="text-xs font-semibold capitalize">
                                                    {styles.label}
                                                </span>
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {event.status === 'scheduled' ? 'event' :
                                                        event.status === 'planning' ? 'edit_calendar' :
                                                            event.status === 'ongoing' ? 'play_circle' : 'check_circle'}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            <SystemInfoCard />
        </div>
    );
}
