import axios from '@/lib/axios';

export interface NotificationItem {
    _id: string;
    userId: string;
    type: 'delete_request' | 'delete_approved' | 'delete_rejected';
    title: string;
    message: string;
    assetId?: string;
    assetName?: string;
    fromUserId?: { _id: string; name: string; avatarUrl?: string } | string;
    fromUserName?: string;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
}

export const notificationService = {
    getNotifications: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
        const response = await axios.get(`/notifications?page=${page}&limit=${limit}`);
        return response.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await axios.get('/notifications/unread-count');
        return response.data.count;
    },

    markAsRead: async (id: string): Promise<void> => {
        await axios.put(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await axios.put('/notifications/read-all');
    }
};
