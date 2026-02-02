import axios from '@/lib/axios';

const API_URL = '/units';

export interface Unit {
    _id?: string;
    name: string;
    symbol: string;
    description?: string;
    status: 'Active' | 'Inactive';
    createdAt?: string;
    updatedAt?: string;
}

export const getUnits = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getUnitById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createUnit = async (data: Unit) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateUnit = async (id: string, data: Unit) => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteUnit = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};
