import axios from 'axios';

const API_URL = '/api/v1/supplies';

export interface Supply {
    _id?: string;
    name: string;
    partNumber: string;
    category: string;
    unit: string;
    departmentId?: string;
    department?: {
        _id: string;
        name: string;
        code: string;
    };
    description?: string;
    unitId?: {
        _id: string;
        name: string;
        symbol: string;
    } | string;

    history?: any[];
    quantity: number;
    minimumStock: number;
    locationId?: string;
    location?: string;
    vendorId?: string;
    compatibleModels?: string[];
    cost?: number;
    images?: {
        url: string;
        caption?: string;
        filename?: string;
    }[];
    createdAt?: string;
    updatedAt?: string;
}

export const getSupplies = async (params?: { search?: string; category?: string; lowStock?: boolean }) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const getSupplyById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createSupply = async (data: Supply) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateSupply = async (id: string, supply: Partial<Supply> & { reason?: string }) => {
    const response = await axios.patch(`${API_URL}/${id}`, supply);
    return response.data;
};

export const deleteSupply = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export const getSupplyHistory = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}/history`);
    return response.data;
};
