import { MetricCard } from './MetricCard';
import { metricStats } from '../data/mock-dashboard';

export function DashboardMetrics() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricStats.map((stat) => (
                <MetricCard key={stat.title} stat={stat} />
            ))}
        </div>
    );
}
