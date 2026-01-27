import { useState } from 'react';

export function AssetTabs() {
    const [activeTab, setActiveTab] = useState('technical');

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['Technical Info', 'Documents', 'Usage History', 'Maintenance'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.toLowerCase()
                                ? 'border-b-2 border-primary text-primary font-bold'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="p-8">
                {activeTab.includes('technical') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left: Specs */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Hardware Specifications
                            </h4>
                            <dl className="grid grid-cols-1 gap-y-4">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Max Resolution</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">4K @ 60Hz (4:4:4)</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">HDCP Compliance</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">v2.2 / v1.4</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Data Rate</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">18 Gbps</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Input Port</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">1x HDMI Type A</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Output Ports</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">4x HDMI Type A</dd>
                                </div>
                            </dl>
                        </div>
                        {/* Right: Electrical/Physical */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Operational Details
                            </h4>
                            <dl className="grid grid-cols-1 gap-y-4">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Power Supply</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">DC 5V/1A (Barrel)</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Operating Temp</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">0°C to 40°C</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Chassis Material</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">Steel Case (Black)</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Weight</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">245g</dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/30 pb-2">
                                    <dt className="text-sm text-slate-500">Certification</dt>
                                    <dd className="text-sm font-semibold dark:text-slate-200">CE, FCC, RoHS</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
                {/* Placeholders for other tabs */}
                {!activeTab.includes('technical') && (
                    <div className="flex items-center justify-center py-12 text-slate-400">
                        Content for {activeTab} is not implemented yet.
                    </div>
                )}
            </div>
        </section>
    );
}
