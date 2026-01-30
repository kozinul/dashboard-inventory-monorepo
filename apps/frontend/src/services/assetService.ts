import axios from 'axios';

// Ensure this matches the backend route prefix: /api/v1/inventory
const API_URL = '/api/v1/inventory';

export interface Asset {
    _id: string; // Backend uses _id
    id?: string; // Frontend often uses id, we might need to map it or use _id
    name: string;
    model: string;
    category: string;
    serial: string;
    locationId?: string;
    location?: string;
    departmentId?: string;
    department?: string;
    status: 'active' | 'maintenance' | 'storage' | 'retired';
    value: number;
    images?: (string | { url: string; caption?: string; filename?: string })[];
    purchaseDate?: string;
    updatedAt?: string;
    createdAt?: string;
    technicalSpecifications?: Record<string, string>;
    rentalRates?: {
        name: string;
        rate: number;
        unit: string;
        notes?: string;
    }[];
    vendor?: {
        name: string;
        contact: string;
        phone: string;
        email: string;
        address: string;
        website: string;
    };
    invoice?: {
        number: string;
        url: string;
        filename: string;
        uploadDate: string;
    };
    warranty?: {
        expirationDate: string;
        details: string;
    };
}

export const assetService = {
    getAll: async (params?: any) => {
        // Backend route is /items
        const response = await axios.get<{ data: Asset[], pagination: any }>(`${API_URL}/items`, { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<Asset>(`${API_URL}/items/${id}`);
        return response.data;
    },

    create: async (data: Omit<Asset, '_id' | 'id'>) => {
        const response = await axios.post<Asset>(`${API_URL}/items`, data);
        return response.data;
    },

    update: async (id: string, data: Partial<Asset>) => {
        const response = await axios.put<Asset>(`${API_URL}/items/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/items/${id}`);
    },

    getStats: async () => {
        const response = await axios.get<any>(`${API_URL}/stats`);
        return response.data;
    }
};
