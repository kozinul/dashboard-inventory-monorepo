import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { SystemInfoCard } from './SystemInfoCard';
import { eventService, Event } from '@/services/eventService';
import { Card } from '@/components/common/Card/Card';
import { cn } from '@/lib/utils'; // Assuming utils are here, inferred from GearQuickViewCard

export function HighPriorityGearPanel() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventService.getAll();
                // Filter for upcoming/ongoing events, excluding cancelled and completed
                const now = new Date();
                const upcoming = data
                    .filter(e => new Date(e.endTime) >= now && e.status !== 'cancelled' && e.status !== 'completed')
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .slice(0, 5); // Show top 5
                setEvents(upcoming);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
            case 'ongoing': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
            case 'planning': return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
            case 'completed': return 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-500/20';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
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
                                                {format(new Date(event.startTime), 'MMM d, h:mm a')} • {event.room}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                                        getStatusColor(event.status)
                                    )}>
                                        <span className="text-xs font-semibold capitalize">
                                            {event.status}
                                        </span>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {event.status === 'scheduled' ? 'event' :
                                                event.status === 'planning' ? 'edit_calendar' :
                                                    event.status === 'ongoing' ? 'play_circle' : 'check_circle'}
                                        </span>
                                    </div>
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
