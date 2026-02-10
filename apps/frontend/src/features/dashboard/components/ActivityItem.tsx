import { RecentTicket } from '@/services/dashboardService';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
    ticket: RecentTicket;
}

// Helper function to get status color class
const getStatusColorClass = (status: string) => {
    const statusMap: Record<string, string> = {
        'Draft': 'bg-slate-500/10 text-slate-500',
        'Sent': 'bg-blue-500/10 text-blue-500',
        'Accepted': 'bg-cyan-500/10 text-cyan-500',
        'In Progress': 'bg-amber-500/10 text-amber-500',
        'Done': 'bg-emerald-500/10 text-emerald-500',
        'Rejected': 'bg-rose-500/10 text-rose-500',
        'Cancelled': 'bg-slate-500/10 text-slate-500',
        'On Hold': 'bg-orange-500/10 text-orange-500',
        'External Service': 'bg-purple-500/10 text-purple-500',
        'Pending': 'bg-yellow-500/10 text-yellow-500',
        'Escalated': 'bg-red-500/10 text-red-500',
    };
    return statusMap[status] || 'bg-slate-500/10 text-slate-500';
};

// Helper function to get type icon
const getTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
        'Repair': 'build',
        'Routine': 'event_repeat',
        'Emergency': 'emergency',
        'Firmware': 'system_update',
        'Installation': 'construction',
        'Inspection': 'search',
        'Maintenance': 'handyman',
    };
    return typeMap[type] || 'build';
};

export function ActivityItem({ ticket }: ActivityItemProps) {
    const timeAgo = formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true });

    return (
        <Link to={`/maintenance/my-tickets`} className="block">
            <div className="p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                <div className="flex-shrink-0">
                    <div className="flex-shrink-0 flex items-center justify-center size-16 rounded-lg bg-primary/10 text-primary border border-transparent">
                        <span className="material-symbols-outlined !text-[32px]">{getTypeIcon(ticket.type)}</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {ticket.ticketNumber} - {ticket.title}
                        </h4>
                        <span className={cn(
                            "text-[10px] font-bold py-1 px-2 rounded-md uppercase tracking-wider whitespace-nowrap ml-2",
                            getStatusColorClass(ticket.status)
                        )}>
                            {ticket.status}
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        Asset: {ticket.asset.name} {ticket.asset.serial ? `| Serial: ${ticket.asset.serial}` : ''} | Type: {ticket.type}
                    </p>

                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <span className="material-symbols-outlined !text-[12px]">schedule</span>
                            {timeAgo}
                        </span>
                        {ticket.requestedBy && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <span className="material-symbols-outlined !text-[12px]">person</span>
                                {ticket.requestedBy.name}
                            </span>
                        )}
                        {ticket.technician && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <span className="material-symbols-outlined !text-[12px]">engineering</span>
                                {ticket.technician.name}
                            </span>
                        )}
                    </div>
                </div>

                <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>
        </Link>
    );
}
