export function MaintenanceTrendChart() {
    return (
        <div className="md:col-span-12 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg dark:text-white">Maintenance Frequency Trends</h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-primary"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Resolution</span>
                    </div>
                </div>
            </div>

            <div className="h-48 w-full relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                    <defs>
                        <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'rgba(0,212,255,0.2)', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'rgba(0,212,255,0)', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    {/* Area Fill */}
                    <path d="M0,150 Q100,80 200,120 T400,60 T600,110 T800,40 T1000,90 V200 H0 Z" fill="url(#grad1)"></path>
                    {/* Line */}
                    <path d="M0,150 Q100,80 200,120 T400,60 T600,110 T800,40 T1000,90" fill="none" stroke="#00d4ff" strokeWidth="3"></path>
                    {/* Second Line (Resolutions) */}
                    <path d="M0,180 Q100,150 200,160 T400,100 T600,140 T800,80 T1000,120" fill="none" stroke="#007BFF" strokeDasharray="5,5" strokeWidth="2"></path>
                </svg>
                {/* X Axis Labels */}
                <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-500 px-2 uppercase tracking-widest">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                </div>
            </div>
        </div>
    );
}
