import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { User, UserStatus } from '../data/mock-users'

interface UserTableProps {
    users: User[]
}

const statusMap: Record<UserStatus, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
    active: { label: 'Active', variant: 'success' },
    away: { label: 'Away', variant: 'warning' },
    offline: { label: 'Offline', variant: 'secondary' },
}

export function UserTable({ users }: UserTableProps) {
    return (
        <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-10 px-4 font-medium align-middle">User</th>
                            <th className="h-10 px-4 font-medium align-middle">Role</th>
                            <th className="h-10 px-4 font-medium align-middle">Status</th>
                            <th className="h-10 px-4 font-medium align-middle">Last Active</th>
                            <th className="h-10 px-4 font-medium align-middle text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 overflow-hidden rounded-full border bg-muted">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-primary/20 text-xs font-bold text-primary">
                                                    {user.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-middle">
                                    <span className="text-foreground">{user.role}</span>
                                </td>
                                <td className="p-4 align-middle">
                                    <Badge variant={statusMap[user.status].variant}>
                                        {statusMap[user.status].label}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle text-muted-foreground">
                                    {user.lastActive}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
