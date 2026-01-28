import { ShareIcon, PrinterIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Asset } from "@/services/assetService";
import { formatIDR } from "@/utils/currency";

interface AssetHeroProps {
    asset: Asset;
    onEdit: () => void;
}

export function AssetHero({ asset, onEdit }: AssetHeroProps) {
    // Determine main image
    const mainImage = (asset.images && asset.images.length > 0) ? asset.images[0] : null;

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main Photo */}
            <div className="lg:col-span-1 h-72 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group relative">
                <div className="absolute top-4 left-4 z-10">
                    <span className={`px-3 py-1 text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 ${asset.status === 'active' ? 'bg-green-500' :
                        asset.status === 'maintenance' ? 'bg-amber-500' :
                            asset.status === 'retired' ? 'bg-slate-500' : 'bg-blue-500'
                        }`}>
                        <span className={`w-1.5 h-1.5 bg-white rounded-full ${asset.status === 'active' ? 'animate-pulse' : ''}`}></span>
                        {asset.status}
                    </span>
                </div>
                {mainImage ? (
                    <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={asset.name}
                        src={mainImage}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-6xl">image_not_supported</span>
                    </div>
                )}
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
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{asset.name}</h2>
                            <p className="text-primary font-mono text-sm font-bold mt-1">{asset.serial}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
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
                            <p className="text-sm font-medium dark:text-slate-200">{asset.category}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Department</p>
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium dark:text-slate-200">{asset.department || 'Unassigned'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Purchased Date</p>
                            <p className="text-sm font-medium dark:text-slate-200">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Value</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <p className="text-sm font-medium dark:text-slate-200">{formatIDR(asset.value)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {/* Placeholder for user avatars, maybe implement later if we track users */}
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500">?</div>
                    </div>
                    <p className="text-xs text-slate-400">
                        Last updated on <span className="text-slate-700 dark:text-slate-200 font-medium">{asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                    </p>
                </div>
            </div>
        </section>
    );
}
