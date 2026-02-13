import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/dashboard';

export interface DashboardStats {
    activeAssets: number;
    rentalAssets: number;
    activeTickets: number;
    outsideService: number;
}

export const dashboardService = {
    getStats: async (branchId?: string): Promise<DashboardStats> => {
        const params = branchId && branchId !== 'ALL' ? { branchId } : {};
        const response = await axios.get(`${API_URL}/stats`, { params });
        return response.data;
    }
};
