export interface UserProfile {
    name: string;
    role: string;
    department: string;
    staffId: string;
    avatarUrl: string;
    lastLogin: string;
    equipmentManaged: number;
    email: string;
    phone: string;
}

export const mockProfile: UserProfile = {
    name: "Andi Pratama",
    role: "AV Technician",
    department: "IT Operations",
    staffId: "Staff #8812",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEQkmLgCbstPEqBRXfgfy2w2mTKcK2eyKJ_osiyYo6W1NtWD31dwl-ob0HZGGCTiuQ4-Co-buJ5GNjPeyZeJHWoz79EFxwe2C10oqq8o8TcTNZl_MzG3RMldncgNAmJFG2tAbxb777p_kekhE4b1EzNuF3sbvDG2f9NiskGkXPjaGX6VuMLXqISAEzqeBEE8RWX5lYIpuev5FxunGVqlyZhMENb8orH2vG5cB_5FYt3Usr6Fm09lcCHlz-U5y_A87AdLjRtq1Tmio",
    lastLogin: "Oct 24, 2023 - 09:12 AM",
    equipmentManaged: 142,
    email: "a.pratama@avcorp.com",
    phone: "+62 812 3456 7890"
};
