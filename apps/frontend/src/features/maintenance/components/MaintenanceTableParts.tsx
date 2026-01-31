import { cn } from '@/lib/utils';

export function AssetInfoCell({ task }: { task: any }) {
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

export function MaintenanceStatusBadge({ status }: { status: any }) {
    if (status === 'In Progress') {
        return (
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-sm font-semibold text-primary">In Progress</span>
            </div>
        );
    }
    if (status === 'Done') {
        return (
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-semibold text-emerald-500">Done</span>
            </div>
        );
    }
    // Pending
    return (
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-sm font-semibold text-amber-500">Pending</span>
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
