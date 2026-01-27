export interface MetricStat {
    title: string;
    value: string;
    description: string;
    icon: string;
    iconColorClass: string;
    trend?: {
        value: string;
        direction: 'up' | 'down';
        colorClass: string;
    };
    progressBar?: {
        percentage: number;
    };
}

export const metricStats: MetricStat[] = [
    {
        title: "Total Assets",
        value: "1,240",
        description: "Active devices in inventory",
        icon: "inventory",
        iconColorClass: "bg-blue-500/10 text-blue-500",
        trend: {
            value: "2.4%",
            direction: "up",
            colorClass: "text-emerald-500"
        }
    },
    {
        title: "Pending Maint.",
        value: "14",
        description: "Requires immediate attention",
        icon: "build",
        iconColorClass: "bg-amber-500/10 text-amber-500"
    },
    {
        title: "Active Transfers",
        value: "5",
        description: "Between facility A and B",
        icon: "local_shipping",
        iconColorClass: "bg-purple-500/10 text-purple-500",
        trend: {
            value: "1%",
            direction: "down",
            colorClass: "text-rose-500"
        }
    },
    {
        title: "Storage Health",
        value: "82%",
        description: "",
        icon: "database",
        iconColorClass: "bg-cyan-500/10 text-cyan-500",
        progressBar: {
            percentage: 82
        }
    }
];

export interface ActivityItem {
    id: string;
    title: string;
    tag: {
        label: string;
        colorClass: string;
    };
    details: string;
    time: string;
    user: string;
    image: string;
}

export const recentActivity: ActivityItem[] = [
    {
        id: "1",
        title: "MacBook Pro M3 - Added by Admin",
        tag: { label: "New Asset", colorClass: "bg-emerald-500/10 text-emerald-500" },
        details: "Serial: SN-2024-X499 | Location: IT Storage Room B",
        time: "2 mins ago",
        user: "Admin (Josh)",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANZBAyoImGG5_Q-wm8bGlla5zeAybOeWHdzSy_2FHI8TR4lf6ZpxqNsfb0qioAzAcTE5FuvZk1HdFPftLPPfNEeWPv-LVaBr3bG_DP2MrUEOHxWPy9o1gqLRyEyyzZZ1moB5VXInlJXDTvzNssPSZd3C4zl5SzXSQRYOgqnf8cY85pNbvIyB2MrPDjtQmQ318Mf0b8ekmr4GLCtzQIyGEFe-Ga6uMdvvbZKMJz2Akxo7sSm5FbfDCelS_JGATTBhv34ZGWRK7KOqk"
    },
    {
        id: "2",
        title: "Sony A7IV - Transferred to Studio B",
        tag: { label: "Transfer", colorClass: "bg-primary/10 text-primary" },
        details: "Serial: SN-CAM-0082 | Dest: Studio B Rack 4",
        time: "45 mins ago",
        user: "Sarah K.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjfzBTcbiuO69jEqQ8_mxo2atfBZtTODl9H9ti_n9DSQtYNo4cbOKbnOTPLynQPHHr15r4H4Moei6ND9sEFhdmgVrIK30rwjcWe5P5kbL55VJ6C0d9ocNT1kNlU5vS3gteKR_oqSTNbe68putyej26usHE_SSoW85AlsNVb8aeEdZLRFHEh0WQ1-c4XIahugpYOafEHigs3DCi7KNyQI0lTIgU7ARmFPoSxZaJ1bH9_kkI7LCG2O2XktU8doEY0sOeqA0YBuU0j-4"
    },
    {
        id: "3",
        title: "Projector 4K - Maintenance Started",
        tag: { label: "Maintenance", colorClass: "bg-rose-500/10 text-rose-500" },
        details: "Asset: PRJ-001 | Status: Lamp Replacement",
        time: "2 hours ago",
        user: "Tech Support",
        image: "" // Special handling for icon placeholder in component
    }
];

export interface GearItem {
    id: string;
    model: string;
    assetId: string;
    image: string;
    status: {
        label: string;
        value: string;
        icon: string;
        colorClass: string; // Text color mainly
        bgClass: string; // Container bg
    };
}

export const highPriorityGear: GearItem[] = [
    {
        id: "1",
        model: "Blackmagic Studio 6K",
        assetId: "ID: BM-CAM-901",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjcKe-DlFUGRG9YrvA0IB5jytEb-c6FIsogPawOpTsLJMr1t2khvKingRNiaAOeomcniZ1ERs4ldahMRHm4akjamL4sl7jLdwMoLh34Bl6JYGAC6-WeeVqdKtShzu61UCBsjN1KYUGEQSLPA6nxL1Av8eM2pdVyxkBdLCWlSDeR5ly4VD8wXo3IUXidF4B-EPOrq6M0VEcdmz6FwT8V6At3usXIZS0bCnR6WHngTHUmwWWkrWc4esGD0tDLNBFuaBtbjVG8rVPqt4",
        status: {
            label: "Current Location",
            value: "Auditorium Main",
            icon: "check_circle",
            colorClass: "text-emerald-500",
            bgClass: "bg-slate-50 dark:bg-slate-800/50"
        }
    },
    {
        id: "2",
        model: "Sennheiser EW-D Kit",
        assetId: "ID: SEN-MIC-42",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIoNrcrLpW9KzhEdYrlqdNoEBZKEuR-bBU8ckbhc11jzm6IQGFYOypiLQkdCyma_wTd1mOGWSfg8NxryXgeJLeCoZCF6l3WD7nWu4yYgUlldvxJGCxmPE3IdCkBhMkWa-M_BBS4i3eCGWpenZC9JgzIKEjtkAaRiF_l-m5bYze3BLOuXVmf8wP_7YWdqFxqm1Y0xFhCW1P-OR2kMjY5fgSDd6e9saW3kpDRe8gfFHMX3MV2Tt4UvZOqG8BaqIDDTsePPPDUdE54Rg",
        status: {
            label: "Battery Status",
            value: "12% - Critical",
            icon: "battery_alert",
            colorClass: "text-amber-500",
            bgClass: "bg-slate-50 dark:bg-slate-800/50 border border-amber-500/20"
        }
    }
];
