import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { VisualActivityFeed } from '@/features/dashboard/components/VisualActivityFeed';
import { HighPriorityGearPanel } from '@/features/dashboard/components/HighPriorityGearPanel';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
    const { user } = useAuthStore();

    return (
        <div className="w-full space-y-8">
            {/* Greeting */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Here's what's happening with your inventory today.
                </p>
            </div>

            {/* Metrics Section */}
            <DashboardMetrics />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <VisualActivityFeed />
                <HighPriorityGearPanel />
            </div>
        </div>
    );
}

