import { assetDistribution } from '../data/mock-reports';

export function AssetDistributionChart() {
    return (
        <div className="md:col-span-4 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 flex flex-col">
            <h3 className="font-bold text-lg mb-6 dark:text-white">Asset Distribution</h3>

            <div className="flex-1 flex items-center justify-center relative">
                {/* Circular SVG representation of a Donut Chart */}
                <svg className="size-40 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#1e293b" strokeWidth="12"></circle>
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#00d4ff" strokeDasharray="251.2" strokeDashoffset="60" strokeWidth="12"></circle>
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#007BFF" strokeDasharray="251.2" strokeDashoffset="200" strokeWidth="12"></circle>
                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#ff4d4d" strokeDasharray="251.2" strokeDashoffset="240" strokeWidth="12"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold dark:text-white">1.2k</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                {assetDistribution.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${item.colorClass}`}></div>
                        <span className="text-xs font-medium text-slate-400">
                            {item.label} ({item.percentage}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
