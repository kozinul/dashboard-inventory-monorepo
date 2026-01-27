import { ShareIcon, PrinterIcon, MapPinIcon } from "@heroicons/react/24/outline";

export function AssetHero() {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main Photo */}
            <div className="lg:col-span-1 h-72 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group relative">
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Available
                    </span>
                </div>
                <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Front profile of professional 4-port HDMI splitter device"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUkcUQuQY6IHg4G06T3w302zf-orRLaYuINpTvF2Ggz9oVRYX_u1UZ5950PzT-t-xjS2ualmlHTEofRE3CbdY2FbwHu5edCCgbJzCKItafJoH0pkdC7UsOafAyvPBV8mFp2ept9ym06E7UwZHrAp9jne4bf7XmQNdIyNQbe8d-UtQNRPFDATD4LEJ30qWVk2q1lj8k1C0R2VAFQ_u8-dUvX9yWW5Ot1jt4gJsqSdxyZWB8w5EWnagRlL4FnYlLFM-N4h30oXQQpmY"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">zoom_in</span> View Fullscreen
                    </button>
                </div>
            </div>

            {/* Right: Technical Details Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">HDMI Splitter 4-Port</h2>
                            <p className="text-primary font-mono text-sm font-bold mt-1">AV-HDMI-004</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-600">
                                <ShareIcon className="w-[18px] h-[18px]" /> Edit
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold transition-all hover:shadow-lg hover:shadow-primary/30">
                                <PrinterIcon className="w-[18px] h-[18px]" /> Label
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-700/50">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Category</p>
                            <p className="text-sm font-medium dark:text-slate-200">Audio Visual</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Storage Location</p>
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium dark:text-slate-200">Gudang BNDCC</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Purchased Date</p>
                            <p className="text-sm font-medium dark:text-slate-200">Oct 12, 2023</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Condition</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <p className="text-sm font-medium dark:text-slate-200">Excellent</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB-ip9lN3gKmONer_kn2WXG4JqqJt8NEPxFpeoY3dbyDTo6HFOkoHGI09j_CqX52uuUwEOF2x25wfH_Ut-EoeiaUz69gTwxFpu0LS96aEJvYXgT_p_8GIs7QrUOCOi-JppOePaBeczdniheTk5QCuItHbLsyQlE5N0LMBtjrM-i4GJymfJLWmcDFps0Gk_yTQT0o77qprguCY4J7IF88sBd0RS_7rKa-kydGIui2mg4bRZDkPyC0fAip1g15761-LEw9nYQbDtYUrc")' }}
                        ></div>
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBiJpl7LMcfmnthv36RSPhW1SpY-7_NJ12KSZQrJ8Qc-dWqmMpTln3STXZ52MFWzl7BeDhdxUNVu1Kz_CGwbezbzOKCn8TsthuK7wUsOk0VYJUQA6Cmazlx81yogPQUpoBnjLPxmvrvB3HRQnUUI4Cff-kMijzgoOdmDvkqIEYhlUY94NIOF8eR5X9LS3nzLZ09P7v6rxqld-chm98VgPICsaK3pg31_HQJ--JbY3vpxnTEjJhe79IBkiYcjUVsci4WLNkP5JN7gqc")' }}
                        ></div>
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                            +3
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        Last inspected by <span className="text-slate-700 dark:text-slate-200 font-medium">James Wilson</span> 4 days ago
                    </p>
                </div>
            </div>
        </section>
    );
}
