import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsTab from '@/features/rental/components/EventsTab';
import EventCalendar from '@/features/rental/components/EventCalendar';
import CreateEventModal from '@/features/rental/components/CreateEventModal';

export default function RentalPage() {
    const [activeTab, setActiveTab] = useState<'events' | 'calendar'>('events');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const navigate = useNavigate();

    const handleCreateEventSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Rental & Event Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">assignment_return</span>
                        Manage events and asset rentals
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">filter_list</span>
                        <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-8 py-2 text-sm font-medium focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Completed</option>
                            <option>Cancelled</option>
                        </select>
                    </div>

                    {activeTab === 'events' ? (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Create Event
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/rental/assign')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Check-out Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`
                            ${activeTab === 'events'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                        `}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`
                            ${activeTab === 'calendar'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                            whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                        `}
                    >
                        Calendar
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'events' ? (
                    <EventsTab refreshTrigger={refreshTrigger} />
                ) : (
                    <EventCalendar />
                )}
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateEventSuccess}
            />
        </div>
    );
}
