export interface SummaryBarData {
    category: string;
    value: number;
    totalHeightPercentage: number;
    colorOpacity: number;
}

export const summaryStats: SummaryBarData[] = [
    { category: "Laptops", value: 412, totalHeightPercentage: 75, colorOpacity: 0.2 },
    { category: "AV Gear", value: 528, totalHeightPercentage: 90, colorOpacity: 0.6 },
    { category: "Monitors", value: 184, totalHeightPercentage: 45, colorOpacity: 0.3 },
    { category: "Printers", value: 96, totalHeightPercentage: 30, colorOpacity: 0.15 },
    { category: "Mobile", value: 214, totalHeightPercentage: 60, colorOpacity: 0.4 },
    { category: "Servers", value: 72, totalHeightPercentage: 25, colorOpacity: 0.1 }
];

export interface AssetDistributionData {
    label: string;
    percentage: number;
    colorClass: string;
}

export const assetDistribution: AssetDistributionData[] = [
    { label: "Available", percentage: 72, colorClass: "bg-primary" },
    { label: "In Use", percentage: 18, colorClass: "bg-blue-600" },
    { label: "Repair", percentage: 8, colorClass: "bg-red-500" },
    { label: "Other", percentage: 2, colorClass: "bg-slate-600" }
];

export interface ReportItem {
    id: string;
    name: string;
    icon: string;
    date: string;
    createdBy: string;
    status: {
        label: string;
        type: 'ready' | 'processing';
    };
    format: string;
}

export const recentReports: ReportItem[] = [
    {
        id: "1",
        name: "Q3_Inventory_Audit_V2",
        icon: "description",
        date: "Oct 24, 2023 • 09:12 AM",
        createdBy: "Sarah Jenkins",
        status: { label: "Ready", type: 'ready' },
        format: "PDF / XLSX"
    },
    {
        id: "2",
        name: "Maintenance_Logs_Sept_23",
        icon: "engineering",
        date: "Oct 21, 2023 • 04:30 PM",
        createdBy: "Marcus Chen",
        status: { label: "Ready", type: 'ready' },
        format: "CSV"
    },
    {
        id: "3",
        name: "Asset_Relocation_Summary",
        icon: "move_item",
        date: "Oct 19, 2023 • 11:45 AM",
        createdBy: "Automated Task",
        status: { label: "Processing", type: 'processing' },
        format: "JSON / PDF"
    }
];
