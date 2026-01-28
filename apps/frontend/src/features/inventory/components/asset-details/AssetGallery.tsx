import { PhotoIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Asset } from "@/services/assetService";

interface AssetGalleryProps {
    asset: Asset;
}

export function AssetGallery({ asset }: AssetGalleryProps) {
    const images = asset.images || [];

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold dark:text-white">Visual Documentation</h3>
                </div>
                <p className="text-xs text-slate-500">{images.length} total images found</p>
            </div>

            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Images */}
                    {images.map((src: string, idx: number) => (
                        <div key={idx} className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <img
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                alt={`${asset.name} - view ${idx + 1}`}
                                src={src}
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                                <p className="text-[10px] text-white font-medium truncate">View {idx + 1}</p>
                            </div>
                        </div>
                    ))}

                    {/* Upload Button */}
                    <button className="aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/5 hover:border-primary transition-all text-slate-500 hover:text-primary">
                        <PlusIcon className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload Photo</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">No images available</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Upload photos to document this asset</p>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Upload Photos
                    </button>
                </div>
            )}
        </section>
    );
}
