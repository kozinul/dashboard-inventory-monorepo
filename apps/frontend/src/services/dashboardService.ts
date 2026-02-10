import axios from '@/lib/axios';

const API_URL = '/dashboard';

export interface RecentTicket {
    _id: string;
    ticketNumber: string;
    title: string;
    description?: string;
    status: string;
    type: string;
    asset: {
        _id: string;
        name: string;
        serial?: string;
    };
    requestedBy?: {
        _id: string;
        name: string;
        email?: string;
    };
    technician?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export const dashboardService = {
    getRecentActivity: async (): Promise<RecentTicket[]> => {
        const response = await axios.get(`${API_URL}/recent-activity`);
        return response.data;
    },

    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    }
};
