import axios from '@/lib/axios';

export interface DisposalRecord {
    _id: string;
    asset: {
        _id: string;
        name: string;
        serial: string;
    };
    requestedBy: {
        _id: string;
        name: string;
    };
    reason: string;
    status: 'Pending Manager Approval' | 'Pending Auditor Approval' | 'Approved' | 'Rejected';
    location?: string;
    date: string;
    branchId?: string;
    managerApproval?: {
        approvedBy: {
            _id: string;
            name: string;
        };
        approvedAt: string;
        comment: string;
    };
    auditorApproval?: {
        approvedBy: {
            _id: string;
            name: string;
        };
        approvedAt: string;
        comment: string;
    };
    createdAt: string;
}

export interface DisposalStats {
    pendingManager: number;
    pendingAuditor: number;
    approved: number;
    rejected: number;
}

const API_URL = '/disposal';

export const disposalService = {
    getRecords: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },
    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    },
    createRecord: async (data: any) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },
    approveRecord: async (id: string, approved: boolean, comment?: string) => {
        const response = await axios.put(`${API_URL}/${id}/approve`, { approved, comment });
        return response.data;
    }
};
