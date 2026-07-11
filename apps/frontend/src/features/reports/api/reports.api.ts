import api from '@/lib/axios';

export const getCategorySummary = async (params?: any) => {
    const res = await api.get('/reports/category-summary', { params });
    return res.data;
};

export const getSupplyMutationReport = async (params?: any) => {
    const res = await api.get('/reports/supply-mutation', { params });
    return res.data;
};

export const exportSupplyMutationExcel = async (params?: any) => {
    const res = await api.get('/reports/supply-mutation/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const disposition = res.headers['content-disposition'];
    const match = disposition?.match(/filename=(.+)/);
    link.download = match ? match[1] : `Item_Mutation_Report_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
