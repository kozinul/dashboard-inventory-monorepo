import { ActivityItem } from './ActivityItem';
import { recentActivity } from '../data/mock-dashboard';

export function VisualActivityFeed() {
    return (
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white tracking-tight">Recent Visual Activity</h2>
                <button className="text-sm font-semibold text-primary hover:underline">View all history</button>
            </div>

            <div className="bg-white dark:bg-slate-card border border-slate-200 dark:border-slate-border rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 overflow-hidden">
                {recentActivity.map((item) => (
                    <ActivityItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
