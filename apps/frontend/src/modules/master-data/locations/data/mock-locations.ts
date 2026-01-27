export interface Location {
    id: string;
    name: string;
    building: string;
    floor: string;
    type: 'Office' | 'Warehouse' | 'Panel' | 'Meeting Room' | 'Lab';
    description?: string;
}

export const mockLocations: Location[] = [
    {
        id: 'LOC-001',
        name: 'Main Server Room',
        building: 'HQ Building',
        floor: 'B1',
        type: 'Lab',
        description: 'Primary data center and network rack'
    },
    {
        id: 'LOC-002',
        name: 'Design Studio A',
        building: 'Creative Block',
        floor: '2nd Floor',
        type: 'Office',
        description: 'Open plan workspace for design team'
    },
    {
        id: 'LOC-003',
        name: 'Equipment Warehouse',
        building: 'Logistics Center',
        floor: 'Ground',
        type: 'Warehouse',
        description: 'Main storage for heavy equipment'
    },
    {
        id: 'LOC-004',
        name: 'Exec Conference Room',
        building: 'HQ Building',
        floor: '5th Floor',
        type: 'Meeting Room',
        description: 'Boardroom with AV conferencing setup'
    },
    {
        id: 'LOC-005',
        name: 'Electrical Panel A',
        building: 'HQ Building',
        floor: '1st Floor',
        type: 'Panel',
        description: 'Main breaker panel for east wing'
    }
];
