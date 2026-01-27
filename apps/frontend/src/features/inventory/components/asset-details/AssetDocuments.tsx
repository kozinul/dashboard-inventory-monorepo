import { DocumentIcon, ArrowDownTrayIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export function AssetDocuments() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                        <DocumentIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold dark:text-white">User_Manual_AVH004.pdf</p>
                        <p className="text-[10px] text-slate-500">PDF Document • 2.4 MB</p>
                    </div>
                </div>
                <button className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <ShieldCheckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold dark:text-white">Warranty_Certificate.pdf</p>
                        <p className="text-[10px] text-slate-500">PDF Document • 1.1 MB</p>
                    </div>
                </div>
                <button className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
}
