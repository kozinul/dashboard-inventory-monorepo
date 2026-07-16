import { create } from 'zustand';
import { notificationService, NotificationItem } from '../services/notificationService';

interface NotificationState {
    notifications: NotificationItem[];
    unreadCount: number;
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    isOpen: boolean;

    fetchNotifications: (page?: number) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    setIsOpen: (open: boolean) => void;
    startPolling: (intervalMs?: number) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    totalPages: 1,
    isLoading: false,
    isOpen: false,

    fetchNotifications: async (page = 1) => {
        try {
            set({ isLoading: true });
            const data = await notificationService.getNotifications(page);
            set({
                notifications: data.notifications,
                unreadCount: data.unreadCount,
                total: data.total,
                page: data.page,
                totalPages: data.totalPages,
                isLoading: false
            });
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') return;
            console.error('Failed to fetch notifications', error);
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const count = await notificationService.getUnreadCount();
            set({ unreadCount: count });
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.name === 'CanceledError') return;
        }
    },

    markAsRead: async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            set(state => ({
                notifications: state.notifications.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationService.markAllAsRead();
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },

    setIsOpen: (open: boolean) => set({ isOpen: open }),

    startPolling: (intervalMs = 30000) => {
        const fetch = get().fetchUnreadCount;
        fetch();
        const interval = setInterval(fetch, intervalMs);
        return () => clearInterval(interval);
    }
}));
