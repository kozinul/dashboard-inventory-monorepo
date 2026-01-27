import { mockRentals, rentalStats } from '@/features/rental/data/mock-rentals';
import { RentalStats } from '@/features/rental/components/RentalStats';
import { RentalTable } from '@/features/rental/components/RentalTable';
import { useNavigate } from 'react-router-dom';

export default function RentalPage() {
    const navigate = useNavigate();
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Rental Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">assignment_return</span>
                        Track and manage asset loans and assignments
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">filter_list</span>
                        <select className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-lg pl-9 pr-8 py-2 text-sm font-medium focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Overdue</option>
                            <option>Returned</option>
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/rental/assign')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Check-out Asset
                    </button>
                </div>
            </div>

            {/* Stats */}
            <RentalStats stats={rentalStats} />

            {/* Table */}
            <RentalTable rentals={mockRentals} />
        </div>
    );
}
