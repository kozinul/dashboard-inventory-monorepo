import { DashboardMetrics } from '@/features/dashboard/components/DashboardMetrics';
import { VisualActivityFeed } from '@/features/dashboard/components/VisualActivityFeed';
import { HighPriorityGearPanel } from '@/features/dashboard/components/HighPriorityGearPanel';

export default function DashboardPage() {
    return (
        <div className="w-full space-y-8">
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

