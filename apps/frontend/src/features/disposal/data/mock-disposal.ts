export interface DisposalStat {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: string;
    colorClass: string;
}

export const disposalStats: DisposalStat[] = [
    {
        label: "Pending Disposal",
        value: "24",
        trend: "up",
        trendValue: "+4",
        icon: "delete_forever",
        colorClass: "text-amber-500 bg-amber-500/10"
    },
    {
        label: "Decommissioned (YTD)",
        value: "156",
        trend: "up",
        trendValue: "+12%",
        icon: "archive",
        colorClass: "text-primary bg-primary/10"
    },
    {
        label: "Value Recovered",
        value: "$12,450",
        trend: "up",
        trendValue: "+$2.4k",
        icon: "savings",
        colorClass: "text-emerald-500 bg-emerald-500/10"
    },
    {
        label: "Compliance Issues",
        value: "0",
        trend: "neutral",
        trendValue: "Clean",
        icon: "verified_user",
        colorClass: "text-indigo-500 bg-indigo-500/10"
    },
];

export interface DisposalRecord {
    id: string;
    assetName: string;
    assetId: string;
    reason: 'End of Life' | 'Damaged' | 'Upgrade' | 'Lost/Stolen';
    status: 'Pending Approval' | 'Scheduled' | 'Disposed' | 'Compliance Check';
    requestedBy: string;
    date: string;
    location: string;
}

export const mockDisposalRecords: DisposalRecord[] = [
    {
        id: "DIS-2024-001",
        assetName: "Dell Latitude 5420",
        assetId: "IT-LT-209",
        reason: "End of Life",
        status: "Pending Approval",
        requestedBy: "James Wilson",
        date: "Oct 24, 2024",
        location: "HQ - IT Storage"
    },
    {
        id: "DIS-2024-002",
        assetName: "HP LaserJet Pro M404",
        assetId: "IT-PRT-105",
        reason: "Damaged",
        status: "Scheduled",
        requestedBy: "Sarah Miller",
        date: "Oct 23, 2024",
        location: "Warehouse B"
    },
    {
        id: "DIS-2024-003",
        assetName: "Cisco IP Phone 8845",
        assetId: "IT-PH-332",
        reason: "Upgrade",
        status: "Disposed",
        requestedBy: "Mike Ross",
        date: "Oct 20, 2024",
        location: "Branch Office 2"
    },
    {
        id: "DIS-2024-004",
        assetName: "iPad Pro 12.9 (2020)",
        assetId: "IT-TAB-055",
        reason: "Lost/Stolen",
        status: "Compliance Check",
        requestedBy: "Security Ops",
        date: "Oct 18, 2024",
        location: "Remote User"
    },
    {
        id: "DIS-2024-005",
        assetName: "Lenovo ThinkCentre M70",
        assetId: "IT-DT-401",
        reason: "End of Life",
        status: "Disposed",
        requestedBy: "James Wilson",
        date: "Oct 15, 2024",
        location: "HQ - Floor 3"
    }
];
