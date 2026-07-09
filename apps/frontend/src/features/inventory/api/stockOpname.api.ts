import api from '@/lib/axios';

export interface StockOpnameItem {
    _id: string;
    stockOpnameId: string;
    supplyId?: any; // Populated supply
    assetId?: any; // Populated asset
    systemQuantity: number;
    physicalQuantity: number;
    isAssetFound: boolean;
    difference: number;
    status: 'PENDING' | 'MATCH' | 'DISCREPANCY' | 'MISSING' | 'FOUND';
    notes?: string;
    checkedBy?: any;
    updatedAt: string;
}

export interface StockOpname {
    _id: string;
    title: string;
    branchId: string;
    departmentId?: any;
    locationId?: any;
    type: 'SUPPLY' | 'ASSET' | 'BOTH';
    status: 'DRAFT' | 'ONGOING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    notes?: string;
    createdBy: any;
    createdAt: string;
}

export const getStockOpnames = async (params?: any) => {
    const res = await api.get('/stock-opname', { params });
    return res.data;
};

export const getStockOpnameDetail = async (id: string) => {
    const res = await api.get(`/stock-opname/${id}`);
    return res.data;
};

export const createStockOpname = async (data: any) => {
    const res = await api.post('/stock-opname', data);
    return res.data;
};

export const startStockOpname = async (id: string) => {
    const res = await api.put(`/stock-opname/${id}/start`);
    return res.data;
};

export const verifyStockOpnameItem = async (itemId: string, data: { physicalQuantity?: number; isAssetFound?: boolean; notes?: string }) => {
    const res = await api.put(`/stock-opname/items/${itemId}`, data);
    return res.data;
};

export const setOpnameToReview = async (id: string) => {
    const res = await api.put(`/stock-opname/${id}/review`);
    return res.data;
};

export const reopenStockOpname = async (id: string) => {
    const res = await api.put(`/stock-opname/${id}/reopen`);
    return res.data;
};

export const completeStockOpname = async (id: string) => {
    const res = await api.put(`/stock-opname/${id}/complete`);
    return res.data;
};

export const deleteStockOpname = async (id: string) => {
    const res = await api.delete(`/stock-opname/${id}`);
    return res.data;
};

export const exportStockOpnameExcel = async (id: string) => {
    const res = await api.get(`/stock-opname/${id}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const disposition = res.headers['content-disposition'];
    const match = disposition?.match(/filename=(.+)/);
    link.download = match ? match[1] : `SO_export_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const importStockOpnameExcel = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/stock-opname/${id}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};
