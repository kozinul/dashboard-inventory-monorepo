import { cn } from "@/lib/utils"

export type StatusType = 'Active' | 'Away' | 'Offline'

const statusStyles: Record<StatusType, { bg: string, text: string, dot: string }> = {
    Active: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-600 dark:text-emerald-400",
        dot: "bg-emerald-500"
    },
    Away: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
        dot: "bg-amber-500"
    },
    Offline: {
        bg: "bg-slate-100 dark:bg-slate-700/50",
        text: "text-slate-500 dark:text-slate-400",
        dot: "bg-slate-400"
    },
}

export function StatusBadge({ status }: { status: StatusType | string }) {
    const styles = statusStyles[status as StatusType] || statusStyles.Offline

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", styles.bg, styles.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></span>
            {status}
        </div>
    )
}
