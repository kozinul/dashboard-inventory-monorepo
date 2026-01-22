import { summaryStats } from '../data/mock-reports';

export function SummaryBarChart() {
    return (
        <div className="md:col-span-8 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-bold text-lg dark:text-white">Inventory by Category</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Stock: 1,248 Units</p>
                </div>
                <div className="text-right">
                    <span className="text-emerald-500 text-sm font-bold">+12.4%</span>
                    <p className="text-[10px] text-slate-400">vs last month</p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-4 h-48 px-2">
                {summaryStats.map((stat) => (
                    <div key={stat.category} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                        <div
                            className="w-full bg-primary/20 rounded-t-lg relative group transition-all"
                            style={{ height: `${stat.totalHeightPercentage}%` }}
                        >
                            <div
                                className="absolute inset-0 bg-primary transition-opacity rounded-t-lg"
                                style={{ opacity: stat.colorOpacity }}
                            ></div>
                            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity rounded-t-lg"></div>

                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {stat.value}
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter text-center leading-none">
                            {stat.category}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
