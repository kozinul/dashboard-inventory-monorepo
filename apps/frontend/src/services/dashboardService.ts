import axios from '@/lib/axios';

const API_URL = '/dashboard';

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

export interface LowStockSupply {
    _id: string;
    name: string;
    partNumber: string;
    quantity: number;
    minimumStock: number;
    unit?: string;
    unitId?: {
        name: string;
    };
    location?: string;
    locationId?: {
        name: string;
    };
}

export const dashboardService = {
    getStats: async (branchId?: string): Promise<DashboardStats> => {
        const params = branchId && branchId !== 'ALL' ? { branchId } : {};
        const response = await axios.get(`${API_URL}/stats`, { params });
        return response.data;
    },
    getRecentActivity: async (): Promise<RecentTicket[]> => {
        const response = await axios.get(`${API_URL}/recent-activity`);
        return response.data;
    },
    getLowStockSupplies: async (branchId?: string): Promise<LowStockSupply[]> => {
        const params = branchId && branchId !== 'ALL' ? { branchId } : {};
        const response = await axios.get(`${API_URL}/low-stock`, { params });
        return response.data;
    }
};
