
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { eventService, Event } from '@/services/eventService';
import { useNavigate } from 'react-router-dom';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function EventCalendar() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

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

    const calendarEvents = events.map(event => ({
        id: event._id,
        title: event.name,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        resource: event,
    }));

    const eventStyleGetter = (event: { resource: Event }) => {
        let backgroundColor = '#64748b'; // slate-500 default
        const status = event.resource.status;
        const now = new Date();
        const isOverdue = new Date(event.resource.endTime) < now && status !== 'completed' && status !== 'cancelled';

        if (isOverdue) backgroundColor = '#f43f5e'; // rose-500 (Red)
        else if (status === 'scheduled') backgroundColor = '#f59e0b'; // amber-500 (Yellow)
        else if (status === 'ongoing') backgroundColor = '#10b981'; // emerald-500 (Green)
        else if (status === 'completed') backgroundColor = '#94a3b8'; // slate-400
        else if (status === 'planning') backgroundColor = '#3b82f6'; // blue-500
        else if (status === 'cancelled') backgroundColor = '#f43f5e'; // rose-500

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm overflow-hidden">
            <style>
                {`
                    .rbc-calendar { min-height: 600px; }
                    .rbc-event { padding: 2px 5px; }
                    .rbc-toolbar button { color: inherit; }
                    .dark .rbc-off-range-bg { background-color: #0f172a; }
                    .dark .rbc-today { background-color: #334155; }
                    .dark .rbc-off-range { color: #64748b; }
                    .dark .rbc-header { color: #e2e8f0; border-bottom-color: #334155; }
                    .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: #334155; }
                    .dark .rbc-day-bg + .rbc-day-bg { border-left-color: #334155; }
                    .dark .rbc-month-row + .rbc-month-row { border-top-color: #334155; }
                    .dark .rbc-date-cell { color: #e2e8f0; }
                    .dark .rbc-toolbar-label { color: #e2e8f0; }
                    .dark .rbc-btn-group button { color: #e2e8f0; border-color: #334155; }
                    .dark .rbc-btn-group button:hover { background-color: #1e293b; }
                    .dark .rbc-btn-group .rbc-active { background-color: #334155; color: white; }
                    .dark .rbc-time-content { border-top-color: #334155; }
                    .dark .rbc-time-content > * + * > * { border-left-color: #334155; }
                    .dark .rbc-time-header-content { border-left-color: #334155; }
                    .dark .rbc-timeslot-group { border-bottom-color: #334155; }
                    .dark .rbc-day-slot .rbc-events-container { margin-right: 0; }
                    .dark .rbc-day-slot .rbc-event { border: 1px solid #334155; }
                `}
            </style>
            <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={view}
                onView={setView}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => navigate(`/events/${event.id}`)}
                popup
            />
        </div>
    );
}
