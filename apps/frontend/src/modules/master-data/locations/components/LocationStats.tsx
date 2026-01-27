import { clsx } from "clsx";

interface StatProps {
    label: string;
    value: React.ReactNode;
    subtitle?: string;
    valueColor?: string;
}

function StatCard({ label, value, subtitle, valueColor = "text-white" }: StatProps) {
    return (
        <div className="bg-background-dark/50 p-4 rounded-lg border border-border-dark">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">
                {label}
            </span>
            <span className={clsx("text-2xl font-header font-bold", valueColor)}>
                {value}
                {subtitle && <span className="text-sm font-normal text-text-secondary ml-1">{subtitle}</span>}
            </span>
        </div>
    );
}

export function LocationStats() {
    return (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-header text-lg font-bold text-white">Floor 02 Utilization</h3>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Under 50%
                    </span>
                    <span className="flex items-center gap-1 ml-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span> 50-80%
                    </span>
                    <span className="flex items-center gap-1 ml-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span> Over 80%
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Capacity"
                    value="2,400"
                    subtitle="Units"
                />
                <StatCard
                    label="Used Space"
                    value="1,682"
                    subtitle="Units"
                />
                <StatCard
                    label="Avg Fullness"
                    value="70.1%"
                />
                <StatCard
                    label="Alerts"
                    value="2"
                    subtitle="Critical"
                    valueColor="text-rose-500"
                />
            </div>
        </div>
    );
}
