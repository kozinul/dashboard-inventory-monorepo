import axios from '@/lib/axios';

const API_URL = '/maintenance';

export interface MaintenanceTicket {
    _id: string;
    ticketNumber: string;
    asset: {
        _id: string;
        name: string;
        serial?: string;
    };
    title: string;
    description?: string;
    type: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'In Progress' | 'Done' | 'Rejected' | 'Cancelled';
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

    // User ticket routes
    getMyTickets: async (): Promise<MaintenanceTicket[]> => {
        const response = await axios.get(`${API_URL}/my-tickets`);
        return response.data;
    },

    createTicket: async (data: CreateTicketDto): Promise<MaintenanceTicket> => {
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

    rejectTicket: async (id: string, reason: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/reject`, { reason });
        return response.data;
    },

    completeTicket: async (id: string): Promise<MaintenanceTicket> => {
        const response = await axios.put(`${API_URL}/${id}/complete`);
        return response.data;
    }
};
