import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1') + '/dashboard';

export interface DashboardStats {
    activeAssets: number;
    rentalAssets: number;
    activeTickets: number;
    outsideService: number;
}

export interface RecentTicket {
    _id: string;
    ticketNumber: string;
    title: string;
    status: string;
    type: string;
    updatedAt: string;
    asset: {
        name: string;
        serial?: string;
    };
    requestedBy?: {
        name: string;
    };
    technician?: {
        name: string;
    };
}

export const dashboardService = {
    getStats: async (branchId?: string): Promise<DashboardStats> => {
        const params = branchId && branchId !== 'ALL' ? { branchId } : {};
        const response = await axios.get(`${API_URL}/stats`, { params, withCredentials: true });
        return response.data;
    },
    getRecentActivity: async (): Promise<RecentTicket[]> => {
        const response = await axios.get(`${API_URL}/recent-activity`, { withCredentials: true });
        return response.data;
    }
};
