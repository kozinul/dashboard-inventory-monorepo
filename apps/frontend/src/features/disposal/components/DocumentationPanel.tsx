export function DocumentationPanel() {
    return (
        <div className="w-80 bg-white dark:bg-card-dark border-l border-slate-200 dark:border-border-dark flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark">
                <h3 className="font-bold text-lg dark:text-white">Documentation</h3>
                <p className="text-xs text-slate-500 mt-1">Manage disposal certificates and logs</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to Upload</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                </div>

                {/* Recent Documents */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Uploads</h4>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="bg-rose-500/10 p-2 rounded text-rose-500">
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold dark:text-slate-200 truncate group-hover:text-primary transition-colors">Disposal_Cert_001.pdf</p>
                            <p className="text-[10px] text-slate-400">1.2 MB • Just now</p>
                        </div>
                        <button className="text-slate-400 hover:text-rose-500">
                            <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="bg-blue-500/10 p-2 rounded text-blue-500">
                            <span className="material-symbols-outlined text-xl">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold dark:text-slate-200 truncate group-hover:text-primary transition-colors">Log_Oct_2024.docx</p>
                            <p className="text-[10px] text-slate-400">800 KB • 2 hrs ago</p>
                        </div>
                        <button className="text-slate-400 hover:text-rose-500">
                            <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </div>

                {/* Workflow Status */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">info</span>
                        Compliance Status
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        All disposal records for October meet ISO 27001 data destruction standards.
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-border-dark">
                <button className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Compliance Report
                </button>
            </div>
        </div>
    );
}
