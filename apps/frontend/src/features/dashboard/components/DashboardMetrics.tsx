import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { dashboardService, DashboardStats } from '@/services/dashboardService';
import { useAppStore } from '@/store/appStore';

export function DashboardMetrics() {
    const { activeBranchId } = useAppStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getStats(activeBranchId);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [activeBranchId]);

    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    const metricCards = [
        {
            title: "Active Assets",
            value: stats.activeAssets.toLocaleString(),
            description: "Ready for use",
            icon: "inventory_2",
            iconColorClass: "bg-blue-500/10 text-blue-500"
        },
        {
            title: "Active Rentals",
            value: stats.rentalAssets.toLocaleString(),
            description: "Currently out for events",
            icon: "event_repeat",
            iconColorClass: "bg-emerald-500/10 text-emerald-500"
        },
        {
            title: "Active Tickets",
            value: stats.activeTickets.toLocaleString(),
            description: "All non-closed tickets",
            icon: "build",
            iconColorClass: "bg-amber-500/10 text-amber-500"
        },
        {
            title: "Service Ke Luar",
            value: stats.outsideService.toLocaleString(),
            description: "Sent to external vendors",
            icon: "engineering",
            iconColorClass: "bg-purple-500/10 text-purple-500"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricCards.map((stat) => (
                <MetricCard key={stat.title} stat={stat} />
            ))}
        </div>
    );
}
