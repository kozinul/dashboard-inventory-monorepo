import axios from '@/lib/axios';

const API_URL = '/maintenance';

export interface MaintenanceTicket {
    _id: string;
    ticketNumber: string;
    asset: {
        _id: string;
        name: string;
        serial?: string;
        department?: string;
        departmentId?: string;
    };
    title: string;
    description?: string;
    type: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'In Progress' | 'Done' | 'Rejected' | 'Cancelled' | 'Closed';
    requestedBy?: {
        _id: string;
        name: string;
        email?: string;
        department?: string;
    };
    requestedAt?: string;
    processedBy?: {
        _id: string;
        name: string;
    };
    processedAt?: string;
    rejectionReason?: string;
    technician?: {
        _id: string;
        name: string;
    };
    cost?: number;
    expectedCompletionDate?: string;
    createdAt: string;
    updatedAt: string;
    history?: {
        status: string;
        changedBy: string | { _id: string; name: string; };
        changedAt: string;
        notes?: string;
    }[];
    visualProof?: string[];
    proofCount?: number;
    beforePhotos?: string[];
    afterPhotos?: string[];
    suppliesUsed?: {
        supply: string;
        name: string;
        quantity: number;
        cost: number;
    }[];
    pendingNote?: string;
}

export interface CreateTicketDto {
    asset: string;
    title: string;
    description?: string;
    type: string;
}

export const maintenanceService = {
    // General routes
    getAll: async (params?: any) => {
        const response = await axios.get(API_URL, { params });
        return response.data;
    },

    create: async (data: any) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    },

    getNavCounts: async () => {
        const response = await axios.get(`${API_URL}/nav-counts`);
        return response.data;
    },

    // User ticket routes
    getMyTickets: async (): Promise<MaintenanceTicket[]> => {
        const response = await axios.get(`${API_URL}/my-tickets`);
        return response.data;
    },

    getTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.get(`${API_URL}/ticket/${id}`);
        return response.data;
    },

    async getById(id: string) {
        const response = await axios.get<MaintenanceTicket>(`${API_URL}/${id}`);
        return response.data;
    },

    createTicket: async (data: CreateTicketDto | FormData): Promise<MaintenanceTicket> => {
        const response = await axios.post(`${API_URL}/ticket`, data);
        return response.data;
    },

    cancelTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/cancel`);
        return response.data;
    },

    sendTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/send`);
        return response.data;
    },

    // Manager/Department routes
    getDepartmentTickets: async (): Promise<MaintenanceTicket[]> => {
        const response = await axios.get(`${API_URL}/department`);
        return response.data;
    },

    acceptTicket: async (id: string, technicianId: string, type?: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/accept`, { technicianId, type });
        return response.data;
    },

    getAssignedTickets: async (): Promise<MaintenanceTicket[]> => {
        const response = await axios.get(`${API_URL}/assigned`);
        return response.data;
    },

    startTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/start`);
        return response.data;
    },

    updateTicketWork: async (id: string, data: any): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/work`, data);
        return response.data;
    },

    rejectTicket: async (id: string, reason: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/reject`, { reason });
        return response.data;
    },

    completeTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/complete`);
        return response.data;
    }
};
