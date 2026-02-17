import axios from '@/lib/axios';

export interface AuditLog {
    _id: string;
    userId: {
        _id: string;
        name: string;
        username: string;
        role: string;
    } | string;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    details?: string;
    ipAddress?: string;
    createdAt: string;
    branchId?: string;
    departmentId?: string;
}

const API_URL = '/audit-logs';

export const auditLogService = {
    getLogs: async (params?: {
        page?: number;
        limit?: number;
        userId?: string;
        resourceType?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await axios.get<{ data: AuditLog[], pagination: any }>(API_URL, { params });
        return response.data;
    },

    exportLogs: async (params?: {
        userId?: string;
        resourceType?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await axios.get(`${API_URL}/export`, {
            params,
            responseType: 'blob'
        });

        // Handle download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
