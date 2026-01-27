export interface AssetStat {
    label: string;
    value: string;
    delta?: string;
    trend: 'success' | 'warning' | 'danger' | 'neutral';
    icon: string;
    iconColor: string;
}

export const inventoryStats: AssetStat[] = [
    {
        label: "Total Assets",
        value: "2,450",
        delta: "+12.5%",
        trend: "success",
        icon: "inventory_2",
        iconColor: "text-primary bg-primary/10"
    },
    {
        label: "Total Value",
        value: "$1.2M",
        delta: "+4.2%",
        trend: "success",
        icon: "attach_money",
        iconColor: "text-emerald-500 bg-emerald-500/10"
    },
    {
        label: "Maintenance",
        value: "14",
        delta: "Urgent",
        trend: "danger",
        icon: "build",
        iconColor: "text-amber-500 bg-amber-500/10"
    },
    {
        label: "Low Stock",
        value: "05",
        delta: "Reorder",
        trend: "warning",
        icon: "low_priority",
        iconColor: "text-rose-500 bg-rose-500/10"
    }
];

export interface Asset {
    id: string;
    name: string;
    model: string;
    category: string;
    serial: string;
    location: string;
    status: 'active' | 'maintenance' | 'storage' | 'retired';
    image: string;
    purchaseDate: string;
    value: string;
}

export const mockAssets: Asset[] = [
    {
        id: "AST-001",
        name: "MacBook Pro 16",
        model: "M3 Max, 64GB RAM",
        category: "Laptops",
        serial: "SN-MBP-2024-001",
        location: "Design Studio A",
        status: "active",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANZBAyoImGG5_Q-wm8bGlla5zeAybOeWHdzSy_2FHI8TR4lf6ZpxqNsfb0qioAzAcTE5FuvZk1HdFPftLPPfNEeWPv-LVaBr3bG_DP2MrUEOHxWPy9o1gqLRyEyyzZZ1moB5VXInlJXDTvzNssPSZd3C4zl5SzXSQRYOgqnf8cY85pNbvIyB2MrPDjtQmQ318Mf0b8ekmr4GLCtzQIyGEFe-Ga6uMdvvbZKMJz2Akxo7sSm5FbfDCelS_JGATTBhv34ZGWRK7KOqk",
        purchaseDate: "Oct 24, 2023",
        value: "$3,499"
    },
    {
        id: "AST-002",
        name: "Sony A7 IV",
        model: "Mirrorless Camera Body",
        category: "AV Gear",
        serial: "SN-CAM-8821-X",
        location: "Equipment Room B",
        status: "storage",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjfzBTcbiuO69jEqQ8_mxo2atfBZtTODl9H9ti_n9DSQtYNo4cbOKbnOTPLynQPHHr15r4H4Moei6ND9sEFhdmgVrIK30rwjcWe5P5kbL55VJ6C0d9ocNT1kNlU5vS3gteKR_oqSTNbe68putyej26usHE_SSoW85AlsNVb8aeEdZLRFHEh0WQ1-c4XIahugpYOafEHigs3DCi7KNyQI0lTIgU7ARmFPoSxZaJ1bH9_kkI7LCG2O2XktU8doEY0sOeqA0YBuU0j-4",
        purchaseDate: "Sep 12, 2023",
        value: "$2,498"
    },
    {
        id: "AST-003",
        name: "Dell Precision",
        model: "5000 Series",
        category: "Workstations",
        serial: "SN-DEL-9921",
        location: "Server Room",
        status: "maintenance",
        image: "",
        purchaseDate: "Jan 15, 2023",
        value: "$1,899"
    },
    {
        id: "AST-004",
        name: "Sennheiser MKH",
        model: "MKH 416 Shotgun",
        category: "Audio",
        serial: "SN-AUD-112",
        location: "Studio C",
        status: "active",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIoNrcrLpW9KzhEdYrlqdNoEBZKEuR-bBU8ckbhc11jzm6IQGFYOypiLQkdCyma_wTd1mOGWSfg8NxryXgeJLeCoZCF6l3WD7nWu4yYgUlldvxJGCxmPE3IdCkBhMkWa-M_BBS4i3eCGWpenZC9JgzIKEjtkAaRiF_l-m5bYze3BLOuXVmf8wP_7YWdqFxqm1Y0xFhCW1P-OR2kMjY5fgSDd6e9saW3kpDRe8gfFHMX3MV2Tt4UvZOqG8BaqIDDTsePPPDUdE54Rg",
        purchaseDate: "Aug 05, 2023",
        value: "$999"
    },
    {
        id: "AST-005",
        name: "Key Light Air",
        model: "Elgato WiFi Panel",
        category: "Lighting",
        serial: "SN-LGT-554",
        location: "Streaming Booth",
        status: "retired",
        image: "",
        purchaseDate: "Mar 10, 2022",
        value: "$129"
    }
];
