import { cn } from "@/lib/utils"

const deptColors: Record<string, string> = {
    'IT INFRASTRUCTURE': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    'OPERATIONS': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
    'CREATIVE SERVICES': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
}

export function DepartmentBadge({ department }: { department?: string | null }) {
    const colorClass = (department && deptColors[department]) || 'bg-slate-100 dark:bg-slate-700 text-slate-500'

    return (
        <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold", colorClass)}>
            {department || 'N/A'}
        </span>
    )
}
