export type UserStatus = 'active' | 'offline' | 'away'
export type UserRole = 'Admin' | 'Editor' | 'Viewer'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    status: UserStatus
    lastActive: string
    avatarUrl?: string
}

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Alex Thompson',
        email: 'alex.t@inventory.com',
        role: 'Admin',
        status: 'active',
        lastActive: 'Now',
        avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
        id: '2',
        name: 'Sarah Chen',
        email: 'sarah.c@inventory.com',
        role: 'Editor',
        status: 'away',
        lastActive: '2h ago',
        avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
        id: '3',
        name: 'Michael Ross',
        email: 'm.ross@inventory.com',
        role: 'Viewer',
        status: 'offline',
        lastActive: '2d ago',
        avatarUrl: 'https://i.pravatar.cc/150?u=3'
    },
    {
        id: '4',
        name: 'Jessica Wu',
        email: 'j.wu@inventory.com',
        role: 'Editor',
        status: 'active',
        lastActive: '5m ago',
        avatarUrl: 'https://i.pravatar.cc/150?u=4'
    },
    {
        id: '5',
        name: 'David Miller',
        email: 'd.miller@inventory.com',
        role: 'Viewer',
        status: 'active',
        lastActive: '12m ago',
        avatarUrl: 'https://i.pravatar.cc/150?u=5'
    },
]
