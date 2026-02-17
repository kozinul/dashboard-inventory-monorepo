import { format } from 'date-fns';
import { Asset } from '../../../../services/assetService';

interface AssetActivityLogTabProps {
    asset: Asset;
}

export function AssetActivityLogTab({ asset }: AssetActivityLogTabProps) {
    // Sort logs by date descending
    const sortedLogs = [...(asset.activityLog || [])].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Log</h3>

            <div className="flow-root">
                <ul className="-mb-8">
                    {sortedLogs.length === 0 ? (
                        <li className="text-gray-500 italic">No activity recorded.</li>
                    ) : (
                        sortedLogs.map((log, logIdx) => (
                            <li key={logIdx}>
                                <div className="relative pb-8">
                                    {logIdx !== sortedLogs.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-800 ${log.action === 'installed' ? 'bg-green-500' :
                                                    log.action === 'dismantled' ? 'bg-orange-500' :
                                                        'bg-blue-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-white text-sm">
                                                    {log.action === 'installed' ? 'check' :
                                                        log.action === 'dismantled' ? 'close' :
                                                            'info'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                                    <span className="font-medium text-gray-900 dark:text-white capitalize">{log.action.replace('_', ' ')}</span>: {log.details}
                                                </p>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                                {format(new Date(log.date), 'MMM d, yyyy HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
