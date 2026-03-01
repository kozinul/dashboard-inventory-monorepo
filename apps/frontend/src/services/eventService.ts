import axios from '@/lib/axios';

const API_URL = '';

export interface Event {
    _id: string;
    name: string;
    room: string;
    startTime: string;
    endTime: string;
    description?: string;
    departmentId?: string;
    status: 'planning' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    rentedAssets?: {
        _id: string; // Subdocument ID
        assetId: {
            _id: string;
            name: string;
            rentalRates: {
                name: string;
                rate: number;
                unit: string;
            }[];
            images?: { url: string }[];
        };
        rentalRate: number;
        rentalRateUnit: string;
    }[];
    planningSupplies?: {
        _id: string; // Subdocument ID
        supplyId: {
            _id: string;
            name: string;
            unit: string;
            cost: number;
            images?: { url: string }[];
        };
        quantity: number;
        cost: number;
    }[];
}

export const eventService = {
    getAll: async (branchId?: string): Promise<Event[]> => {
        const response = await axios.get(`${API_URL}/events`, {
            params: branchId && branchId !== 'ALL' ? { branchId } : {}
        });
        return response.data;
    },

    getById: async (id: string): Promise<Event> => {
        const response = await axios.get(`${API_URL}/events/${id}`);
        return response.data;
    },

    create: async (data: Omit<Event, '_id' | 'status' | 'rentedAssets' | 'planningSupplies'>): Promise<Event> => {
        const response = await axios.post(`${API_URL}/events`, data);
        return response.data;
    },

    update: async (id: string, data: Partial<Event> | any): Promise<Event> => {
        const response = await axios.put(`${API_URL}/events/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/events/${id}`);
    },

    getByAsset: async (assetId: string): Promise<Event[]> => {
        const response = await axios.get<Event[]>(`${API_URL}/events/asset/${assetId}`);
        return response.data;
    }
};
