import { DisposalRecord } from '../services/disposalService';
import { cn } from '@/lib/utils';

export function AssetCell({ record }: { record: DisposalRecord }) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <span className="font-bold dark:text-slate-100">{record.asset.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-mono text-[10px]">
                {record.asset.serial}
            </div>
        </div>
    );
}

export function ReasonBadge({ reason }: { reason: string }) {
    return (
        <span className={cn(
            "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border",
            reason === 'End of Life' ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" :
                reason === 'Damaged' ? "bg-rose-500/10 text-rose-600 border-rose-200" :
                    reason === 'Lost/Stolen' ? "bg-purple-500/10 text-purple-600 border-purple-200" :
                        "bg-blue-500/10 text-blue-600 border-blue-200"
        )}>
            {reason}
        </span>
    );
}

export function WorkflowStatusIndicator({ status }: { status: DisposalRecord['status'] }) {
    const statusConfig = {
        'Pending Manager Approval': { color: 'bg-amber-500', text: 'text-amber-500', label: 'Mgr Approval' },
        'Pending Auditor Approval': { color: 'bg-blue-500', text: 'text-blue-500', label: 'Auditor Approval' },
        'Approved': { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Approved' },
        'Rejected': { color: 'bg-rose-500', text: 'text-rose-500', label: 'Rejected' }
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", config.color, status.includes('Pending') ? 'animate-pulse' : '')}></span>
            <span className={cn("text-[10px] font-bold uppercase", config.text)}>
                {config.label}
            </span>
        </div>
    );
}
