export interface MaintenanceStat {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue?: string;
    trendLabel?: string;
    icon: string;
    colorClass?: string; // Kept for flexible styling usage if needed, but HTML implies specific colors per card type
    progressBar?: number; // For the "Completed" card
    type: 'active' | 'pending' | 'completed'; // To help cleaner distinguishing in component
}

export const maintenanceStats: MaintenanceStat[] = [
    {
        label: "Active Repairs",
        value: "12",
        trend: "up",
        trendValue: "+5%",
        trendLabel: "from last week",
        icon: "build",
        type: 'active'
    },
    {
        label: "Pending Maintenance",
        value: "45",
        trend: "neutral", // Using neutral to map to the 'High Urgency' logic custom display
        trendValue: "High Urgency", // Custom display text
        trendLabel: "8 past due",
        icon: "pending_actions",
        type: 'pending'
    },
    {
        label: "Completed this Month",
        value: "128",
        trend: "up", // Unused for this specific card layout but good for type safety
        icon: "check_circle",
        progressBar: 82,
        type: 'completed'
    }
];

export interface Technician {
    name: string;
    avatar: string;
}

export interface MaintenanceTask {
    id: string;
    assetName: string;
    assetId: string;
    technician: Technician;
    type: 'Repair' | 'Routine' | 'Emergency' | 'Firmware' | 'Installation' | 'Inspection' | 'Maintenance';
    status: 'In Progress' | 'Done' | 'Pending';
    visualProof: string[]; // Array of image URLs
    proofCount?: number; // For "+1" indicators
}

export const mockTasks: MaintenanceTask[] = [
    {
        id: "AV-7742-SB",
        assetName: "Sony Bravia 4K Display",
        assetId: "AV-7742-SB",
        technician: {
            name: "John Doe",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD362EHTy7kuJU7Vxv8DpRLDqBiy6z9g_FMK4ntlIBOOL0EcMPBEtlc0CA5OEzJv5_IQdUUQdb7sl88y8XocUbKi8dNUehjqNCzJ1YaGF4-dAUBZCAwuhe8D0w4GaWt-KoI3URuyurFhEQJDp71vGQ0VUUEMJhnVI8KkQlFu6SgAfNzaTdspe5IFe5e9FjH94tvMFy91mXP4SncBd-SmcuJbDkYsUvGzfp7A387HJaEvU0CQOP_Ip8U7yCrM-J6bPPxvdX4dduNwCU"
        },
        type: "Repair",
        status: "In Progress",
        visualProof: [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBOwuhqOIYnx02SM_HECtM9kZ4kNl8rGZcs8M0KaYUEquxwh4ITFAkyGoU4AmBVwxPah2hsCcad8n6ETsgqiYwKsWwHBsxHWZtVLYl9BtWX9nLgyPrbSiLGw0Y-IAFTWt0bCVXlaovRsU87XP1me9ioWR4x6pkm1Avh_Pn31VcHmshiqZVxk5YTcE8jWbTOCNq63DdUjFbSJhpeVdrSYCz618jK18JfY4-ZMRk6F6iVOc-nlLPi2JCBcVcLbFy0-ZMFynhoLWOHdrc"
        ],
        proofCount: 1
    },
    {
        id: "IT-1102-CS",
        assetName: "Cisco Nexus C9318",
        assetId: "IT-1102-CS",
        technician: {
            name: "Sarah Miller",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9YsuO6sK72utOvfzo5Jne2g8J9QTj5SOI5jTPOSmRJlxSmw78pHZs7-gLEfxo6eZZKibrg5CnsPNdE5HaUUEWRBdExVtAZ0NRsFcRLdZ0AIyHWubSiDPPuhNm8dDNuF86ldTnbqL8rphLdU90yvFZT4uOxAnkwV5Kmp66LDZ0RjDhBQCp-XC2ZD3uFExS6YRzxszY7pxabHjtAtRlCSENuH8-0ysq6Uj9eY3tfxOg7Ybj6m6IXOdc-njYtgom2qp3oCM17UyeQ3o"
        },
        type: "Routine",
        status: "Done",
        visualProof: [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ5Wyjh6iu_q0yONauDX8FupU2rMlHRDlVa2b1LRTd94t9G6kygt6jyz2cnAUlntjlhpXp7G0H1czh8fbWDi108mgHwNnGbDiw_-e1DaMf3G32_3rXccCVw3_jccmUfSNTX-Bami9fzC5VH1k3UzD5b40_0GpLsO2YPesA1E2j_TegDuNaDgpdNejIYmCzpNDvIu8hgG75xf7nSCV81k2ruXoXzsYdDMD4biUu35nKf_fo2q_J-52roh_XqcDjvMgjlBcIH3KckUk",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAseQqvCuzQwRw-SRUaeVZF8od6BrQhtVILKn-LnLgVNy-4B7XY5ExuKdndvxsRYYc-5r8XSY0loZhizMlT5Tg3Xf_GfqFAyOoAfYeh4yX11dM2kbcusGU6dHtErOdcdFtGwMTwnESqLLyl4GurgPNQYFm_9WuW9FX6F_qwaxuijgwEdL0ERjBPldwZI6F11o6xvlP0wSkyXYMSOKKY_EygBfR7AsCVx90S-49HPF2__e9yWJSUziTLa4zXWF0NE8WFXyEA6r2GrPQ"
        ]
    },
    {
        id: "AV-3301-SH",
        assetName: "Shure Wireless Receiver",
        assetId: "AV-3301-SH",
        technician: {
            name: "Mike Ross",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFDDypmtlBPdfEzDvVQOquca72AibF0rglR7FF9VQklla3mZQ6dqhoon9Sqs_zsSMimaAyEb1uhTMm4TPumNjgbWetmQeN2QW7McErDNFJM5-4rZVpkNRFlT8H7BW3GlrZ37jzS8s5xRmdW8QtpHPUoLJ4pV_Psv8cc9D2KOdGDZ0fPsQTBQfZ-pT6mcc8F0Eb4lTbXRoVDMt3CD5kYkyUMFDwAuLjk8Hg6oJ0oHI8EGNIcAN2cLQBVIg7TCLQpgxwehLyD-YVwLo"
        },
        type: "Repair",
        status: "Pending",
        visualProof: []
    }
];
