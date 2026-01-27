export type RentalStatus = 'active' | 'overdue' | 'returned';

export interface RentalItem {
    id: string;
    assetId: string;
    assetName: string;
    image: string;
    assignedTo: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        department: string;
    };
    checkedOutDate: string;
    dueDate: string;
    status: RentalStatus;
    notes?: string;
}

export const mockRentals: RentalItem[] = [
    {
        id: 'RNT-001',
        assetId: 'AST-023',
        assetName: 'MacBook Pro 16" M2',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=1000',
        assignedTo: {
            id: 'USR-104',
            name: 'Sarah Chen',
            email: 'sarah.c@company.com',
            department: 'Engineering'
        },
        checkedOutDate: '2024-03-15',
        dueDate: '2024-04-15',
        status: 'active'
    },
    {
        id: 'RNT-002',
        assetId: 'AST-045',
        assetName: 'Sony Alpha a7 IV',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
        assignedTo: {
            id: 'USR-089',
            name: 'Mike Ross',
            email: 'mike.r@company.com',
            department: 'Creative'
        },
        checkedOutDate: '2024-03-10',
        dueDate: '2024-03-24',
        status: 'overdue'
    },
    {
        id: 'RNT-003',
        assetId: 'AST-012',
        assetName: 'iPad Pro 12.9"',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=1000',
        assignedTo: {
            id: 'USR-112',
            name: 'Jessica Pearson',
            email: 'j.pearson@company.com',
            department: 'Management'
        },
        checkedOutDate: '2024-03-20',
        dueDate: '2024-03-27',
        status: 'active'
    },
    {
        id: 'RNT-004',
        assetId: 'AST-088',
        assetName: 'Zoom H6 Recorder',
        image: 'https://images.unsplash.com/photo-1590845947391-ba1b756297e0?auto=format&fit=crop&q=80&w=1000',
        assignedTo: {
            id: 'USR-056',
            name: 'David Lee',
            email: 'david.l@company.com',
            department: 'Marketing'
        },
        checkedOutDate: '2024-03-18',
        dueDate: '2024-03-21',
        status: 'returned'
    },
    {
        id: 'RNT-005',
        assetId: 'AST-034',
        assetName: 'Dell XPS 15',
        image: 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&q=80&w=1000',
        assignedTo: {
            id: 'USR-156',
            name: 'Amanda Clarke',
            email: 'amanda.c@company.com',
            department: 'Sales'
        },
        checkedOutDate: '2024-03-01',
        dueDate: '2024-03-31',
        status: 'active'
    }
];

export const rentalStats = [
    {
        name: 'Active Rentals',
        value: '12',
        change: '+2',
        changeType: 'positive',
        icon: 'calendar_clock'
    },
    {
        name: 'Overdue Items',
        value: '3',
        change: '+1',
        changeType: 'negative',
        icon: 'warning'
    },
    {
        name: 'Total Returned (Month)',
        value: '45',
        change: '+12%',
        changeType: 'positive',
        icon: 'keyboard_return'
    },
    {
        name: 'Avg. Rental Duration',
        value: '5.2 days',
        change: '-0.5',
        changeType: 'neutral',
        icon: 'timelapse'
    }
];
