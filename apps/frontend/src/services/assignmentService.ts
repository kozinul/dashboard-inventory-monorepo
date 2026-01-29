export interface Assignment {
    id: string;
    assetId: string;
    assetName: string;
    assetImage: string;
    serialNumber: string;
    category: string;
    assignedTo: {
        name: string;
        initials: string;
        avatar?: string;
        color?: string;
        department?: string;
    };
    location: string;
    dateIssued: string;
    expectedReturn: string;
    status: 'active' | 'overdue' | 'due-today' | 'returned';
}

export const mockAssignments: Assignment[] = [
    {
        id: '#AS-4921',
        assetId: '1',
        assetName: 'MacBook Pro 16" (M2)',
        assetImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTs6znmFeVVcjydb3rnbekJRDam9SiIlhrfo0t8YwXg-RjvjomnkPItZ20krclJyaOthI0Az_ofJaZYz_pSKbve5BxHsGcL_Fh3fwSH_0XG8CYn5GXBoY8FuS24R1OG76EA0Cm973pkcjQd_Djy_8Wye0eAYFyCa2J8ZHic3bTyA3IbYBp1m_glXPrMbBkYuLqH7LcNH_5oL0UplqhnN7sg0oo3mVoUVWP7wu7ywSj3DYSrFMh0huvcbvyj4hJVpXI9uNl0-r3Jb0',
        serialNumber: 'C02F83VBMD6R',
        category: 'Laptop',
        assignedTo: {
            name: 'Sarah Jenkins',
            initials: 'SJ',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC18UAKCH8F21exlpWGzwRABiXFEUT3oxa7-gYm0clAqBqw-eKxoznDQNQHpjjmaZyNcMp-MPr12XVn6HWpfmH4jzPttooouiuwiFZpKpJTK-KYaeFbPv0q581021OpnbRwv1SDIOS6xyyTVx1PofYZWwtqie4ulUVsEPFGb0rv_vM2lGuUTdy1mu8BvrRpivDLy6IT24c_n3fZBOyqu6sMKVEbIfowFKQa8ICLZoiTC82ml6VjKu19BjL4ehiyuPx4eC2ZL3yN0Y',
            department: 'Design',
        },
        location: 'HQ - Floor 3',
        dateIssued: 'Oct 12, 2023',
        expectedReturn: 'Oct 12, 2024',
        status: 'active',
    },
    {
        id: '#AS-4812',
        assetId: '2',
        assetName: 'Sony Alpha A7 IV',
        assetImage: '',
        serialNumber: 'SN-9021-332',
        category: 'Camera',
        assignedTo: {
            name: 'David Kim',
            initials: 'DK',
            color: 'bg-indigo-500',
            department: 'Marketing',
        },
        location: 'Studio A',
        dateIssued: 'Nov 05, 2023',
        expectedReturn: 'Nov 05, 2023',
        status: 'overdue',
    },
    {
        id: '#AS-4799',
        assetId: '3',
        assetName: 'Dell UltraSharp 27"',
        assetImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQjY6tsCEkDervM_uhjafcIqXHVrMA2DLTv8WS-xDA20zteyQ0dzfYGDGVF10ogEq3UrdMCNT73u7rSeYPusEfUDrZhGOvQEKOv-YrlZMJi7t6MC99_XbTRvoUYTI5sdSoqwY81_-nVzSxJ_UINlS3Ea-LVtsXKcHcxqCsBxIedA5fVcGLbkZQZ6KMn2BX_BfiP91FZFVBV9TI_nyd1E2I-4cL7ed-VtMrZNbs5UugZlV5yllWYmpMEvGTyjckPW0ANos2q6RjiME',
        serialNumber: 'DEL-827-X1',
        category: 'Monitor',
        assignedTo: {
            name: 'Mark Thompson',
            initials: 'MT',
            color: 'bg-orange-500',
            department: 'Engineering',
        },
        location: 'Remote',
        dateIssued: 'Dec 01, 2023',
        expectedReturn: 'Dec 01, 2024',
        status: 'active',
    },
    {
        id: '#AS-4652',
        assetId: '4',
        assetName: 'Logitech G Pro X',
        assetImage: '',
        serialNumber: 'LOGI-HS-22',
        category: 'Accessory',
        assignedTo: {
            name: 'Elena Cruz',
            initials: 'EC',
            color: 'bg-emerald-500',
            department: 'Support',
        },
        location: 'HQ - Floor 1',
        dateIssued: 'Jan 15, 2024',
        expectedReturn: 'Jan 30, 2024',
        status: 'due-today',
    },
    {
        id: '#AS-4521',
        assetId: '5',
        assetName: 'iPad Air (5th Gen)',
        assetImage: '',
        serialNumber: 'PAD-M1-882',
        category: 'Tablet',
        assignedTo: {
            name: 'Robert Brown',
            initials: 'RB',
            color: 'bg-purple-500',
            department: 'Sales',
        },
        location: 'Field Office',
        dateIssued: 'Feb 02, 2024',
        expectedReturn: 'Aug 02, 2024',
        status: 'active',
    },
];

export const assignmentService = {
    getAll: async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockAssignments;
    },
    getByAssetId: async (_assetId: string) => {
        // In a real app, we'd filter by assetId
        // For now, return a subset or all for demo
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockAssignments;
    }
};
