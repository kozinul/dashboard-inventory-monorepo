import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Rental {
    _id: string;
    assetId: {
        _id: string;
        name: string;
        assetId: string;
    };
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    eventId?: {
        _id: string;
        name: string;
    };
    rentalDate: string;
    expectedReturnDate: string;
    returnedDate?: string;
    status: 'active' | 'returned' | 'overdue';
    notes?: string;
}

export const rentalService = {
    getAll: async (): Promise<Rental[]> => {
        const response = await axios.get(`${API_URL}/rentals`);
        return response.data;
    },

    create: async (data: any): Promise<Rental> => {
        const response = await axios.post(`${API_URL}/rentals`, data);
        return response.data;
    },

    getById: async (id: string): Promise<Rental> => {
        const response = await axios.get(`${API_URL}/rentals/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<Rental>): Promise<Rental> => {
        const response = await axios.put(`${API_URL}/rentals/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/rentals/${id}`);
    }
};
