export function StatsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <StatsCard
                title="Growth"
                icon="trending_up"
                value="+12%"
                subtext="User onboarding this month"
            />
            <StatsCard
                title="Active Rate"
                icon="online_prediction"
                value="84.2%"
                subtext="Current system utilization"
            />
            <StatsCard
                title="Depts"
                icon="corporate_fare"
                value="12"
                subtext="Registered organizational units"
            />
            <StatsCard
                title="Security"
                icon="verified_user"
                value="98%"
                subtext="MFA compliance across organization"
            />
        </div>
    )
}

function StatsCard({ title, icon, value, subtext }: { title: string, icon: string, value: string, subtext: string }) {
    return (
        <div className="bg-white dark:bg-slate-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">{title}</span>
                <span className="material-symbols-outlined text-primary">{icon}</span>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-xs text-slate-400">{subtext}</div>
        </div>
    )
}
