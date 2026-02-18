import { Asset } from "@/services/assetService";
import { formatIDR } from "@/utils/currency";

interface AssetPurchasingTabProps {
    asset: Asset;
}

export function AssetPurchasingTab({ asset }: AssetPurchasingTabProps) {
    if (!asset.vendor && !asset.invoice && !asset.warranty) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">shopping_bag</span>
                <p>No purchasing information available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Purchase Details */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">sell</span>
                    Purchase Details
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purchase Date</p>
                        <p className="text-base font-medium text-slate-900 dark:text-slate-200">
                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purchase Cost</p>
                        <p className="text-base font-medium text-slate-900 dark:text-slate-200">
                            {formatIDR(asset.value || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Vendor Information */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">storefront</span>
                    Vendor Information
                </h3>
                {asset.vendor ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendor Name</p>
                            <p className="text-base font-medium text-slate-900 dark:text-slate-200">{asset.vendor.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Website</p>
                            {asset.vendor.website ? (
                                <a href={asset.vendor.website} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-primary hover:underline flex items-center gap-1">
                                    {asset.vendor.website}
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                </a>
                            ) : (
                                <p className="text-base font-medium text-slate-900 dark:text-slate-200">-</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Person / Phone</p>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-slate-900 dark:text-slate-200">{asset.vendor.contact || '-'}</p>
                                {asset.vendor.phone && <p className="text-sm text-slate-600 dark:text-slate-400">{asset.vendor.phone}</p>}
                                {asset.vendor.email && <p className="text-sm text-slate-600 dark:text-slate-400">{asset.vendor.email}</p>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Address</p>
                            <p className="text-base font-medium text-slate-900 dark:text-slate-200">{asset.vendor.address || '-'}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No vendor details provided.</p>
                )}
            </div>

            {/* Invoice / Receipt */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                    Invoice & Receipt
                </h3>
                {asset.invoice ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{asset.invoice.filename}</p>
                                <p className="text-xs text-slate-500">Uploaded on {new Date(asset.invoice.uploadDate).toLocaleDateString()}</p>
                            </div>
                            <a
                                href={asset.invoice.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download
                            </a>
                        </div>

                        {/* Preview if image */}
                        {asset.invoice.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="relative aspect-[16/9] w-full max-w-2xl bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                    src={asset.invoice.url}
                                    alt="Invoice"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-slate-100 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">description</span>
                                <p className="text-slate-500">Preview not available for this file type.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No invoice uploaded.</p>
                )}
            </div>

            {/* Warranty Information */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    Warranty
                </h3>
                {asset.warranty ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expiration Date</p>
                                <p className="text-base font-medium text-slate-900 dark:text-slate-200">
                                    {asset.warranty.expirationDate ? new Date(asset.warranty.expirationDate).toLocaleDateString() : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                {asset.warranty.expirationDate && new Date(asset.warranty.expirationDate) > new Date() ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        Expired
                                    </span>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Warranty Details</p>
                                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {asset.warranty.details || 'No additional details provided.'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No warranty information provided.</p>
                )}
            </div>
        </div>
    );
}
