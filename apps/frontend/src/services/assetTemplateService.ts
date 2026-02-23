import axios from '@/lib/axios';

const API_URL = '/asset-templates';

export interface AssetTemplate {
    _id: string;
    code: string;
    name: string;
    model: string;
    category: string;
    defaultValue: number;
    technicalSpecifications?: Record<string, string>;
    serialPrefix: string;
    lastSerialNumber: number;
    images?: { url: string; caption?: string; filename?: string }[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GenerateAssetsPayload {
    quantity: number;
    startingSerial?: string;
    departmentId?: string;
    department?: string;
    locationId?: string;
    location?: string;
    status?: 'active' | 'maintenance' | 'storage' | 'retired';
    purchaseDate?: string;
}

export const assetTemplateService = {
    getAll: async () => {
        const response = await axios.get<AssetTemplate[]>(API_URL);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await axios.get<AssetTemplate>(`${API_URL}/${id}`);
        return response.data;
    },

    create: async (data: Omit<AssetTemplate, '_id' | 'lastSerialNumber' | 'createdAt' | 'updatedAt'>) => {
        const response = await axios.post<AssetTemplate>(API_URL, data);
        return response.data;
    },

    update: async (id: string, data: Partial<AssetTemplate>) => {
        const response = await axios.put<AssetTemplate>(`${API_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/${id}`);
    },

    generateAssets: async (id: string, data: GenerateAssetsPayload) => {
        const response = await axios.post<{ message: string; assets: any[] }>(`${API_URL}/${id}/generate`, data);
        return response.data;
    }
};

// Clone asset function (uses inventory endpoint)
export const cloneAsset = async (id: string, serial: string) => {
    // Using relative path (no leading slash) to ensure it joins with /api/v1 baseURL correctly
    const response = await axios.post(`inventory/items/${id}/clone`, { serial });
    return response.data;
};

// Bulk clone asset function (uses inventory endpoint)
export const bulkCloneAsset = async (id: string, serials: string[]) => {
    const response = await axios.post(`inventory/items/${id}/clone-bulk`, { serials });
    return response.data;
};
