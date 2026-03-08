import { cn } from '@/lib/utils';

export function AssetInfoCell({ task }: { task: any }) {
    if (task.isInternalDepartment) {
        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-500 text-[16px]" title="Internal Panel Ticket">dns</span>
                    <span className="font-bold text-sm dark:text-white">{task.title || task.locationTarget?.name || 'Internal Infrastructure'}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-indigo-500 font-medium tracking-tight bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                        Internal Dept
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{task.locationTarget?.type || 'Panel'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <span className="font-bold text-sm dark:text-white">{task.title || task.asset?.name || 'Unknown Asset'}</span>
            <span className="text-xs text-slate-500 font-medium tracking-tight">ID: {task.asset?.serial || task.asset?._id || 'N/A'}</span>
        </div>
    );
}

export function TechnicianCell({ technician }: { technician: any }) {
    if (!technician) {
        return <span className="text-slate-400 text-xs italic">Unassigned</span>;
    }
    return (
        <div className="flex items-center gap-2">
            <img src={technician.avatar || 'https://ui-avatars.com/api/?name=Tech&background=random'} alt="Technician" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-sm font-medium dark:text-slate-200">{technician.name || 'Unknown'}</span>
        </div>
    );
}

export function MaintenanceTypeBadge({ type }: { type: any }) {
    const styles = {
        Repair: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        Routine: "bg-primary/10 text-primary border-primary/20",
        Emergency: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        Firmware: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        Inspection: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        Installation: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        Maintenance: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    };
    const styleClass = styles[type as keyof typeof styles] || styles.Maintenance;

    return (
        <span className={cn("px-2 py-0.5 rounded font-bold uppercase border text-[10px]", styleClass)}>
            {type}
        </span>
    );
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { color: string, pulse?: boolean }> = {
        'Draft': { color: 'bg-slate-400' },
        'Sent': { color: 'bg-blue-400' },
        'Pending': { color: 'bg-amber-500' },
        'Accepted': { color: 'bg-cyan-500' },
        'Escalated': { color: 'bg-orange-600' },
        'In Progress': { color: 'bg-primary', pulse: true },
        'Service': { color: 'bg-indigo-500', pulse: true },
        'Done': { color: 'bg-emerald-500' },
        'Closed': { color: 'bg-emerald-600' },
        'Cancelled': { color: 'bg-rose-500' }
    };

    const config = statusConfig[status] || { color: 'bg-slate-400' };

    return (
        <div className="flex items-center gap-2">
            <span className={cn(
                "w-2 h-2 rounded-full",
                config.color,
                config.pulse && "animate-pulse"
            )}></span>
            <span className={cn(
                "text-sm font-semibold",
                config.color.replace('bg-', 'text-')
            )}>
                {status || 'Unknown'}
            </span>
        </div>
    );
}

export function VisualProofCell({ task }: { task: any }) {
    const images = task.visualProof;
    if (!images || images.length === 0) {
        return <span className="text-slate-500 italic text-[10px]">No visual proof</span>;
    }

    return (
        <div className="flex -space-x-2">
            {images.map((img: string, idx: number) => (
                <div key={idx} className="w-10 h-10 rounded border-2 border-slate-900 overflow-hidden relative group cursor-zoom-in z-0 hover:z-10">
                    <img
                        src={img}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        alt={`Proof ${idx}`}
                    />
                </div>
            ))}
            {task.proofCount && task.proofCount > 0 && (
                <div className="w-10 h-10 rounded border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 z-0">
                    +{task.proofCount}
                </div>
            )}
        </div>
    );
}
