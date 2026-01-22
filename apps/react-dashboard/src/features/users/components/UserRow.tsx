import { StatusBadge } from "@/components/common/StatusBadge"
import { DepartmentBadge } from "./DepartmentBadge"
import { User } from "@/data/mock-users"

export function UserRow({ user }: { user: User }) {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-hover transition-colors group border-slate-100 dark:border-slate-700/50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img
                        className="w-10 h-10 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                        src={user.avatarUrl}
                        alt={`Portrait of ${user.name}`}
                    />
                    <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{user.email}</td>
            <td className="px-6 py-4">
                <DepartmentBadge department={user.department} />
            </td>
            <td className="px-6 py-4 font-medium italic text-slate-600 dark:text-slate-300">{user.designation}</td>
            <td className="px-6 py-4 text-center">
                <StatusBadge status={user.status} />
            </td>
            <td className="px-6 py-4 text-right">
                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-900/50 rounded-lg transition-colors text-slate-400 group-hover:text-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </td>
        </tr>
    )
}
