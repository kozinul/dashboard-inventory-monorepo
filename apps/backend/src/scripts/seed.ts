import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Asset } from '../models/asset.model.js';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { DisposalRecord } from '../models/disposal.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const users = [
    {
        email: 'admin@dashboard.com',
        name: 'Admin User',
        role: 'admin',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANZBAyoImGG5_Q-wm8bGlla5zeAybOeWHdzSy_2FHI8TR4lf6ZpxqNsfb0qioAzAcTE5FuvZk1HdFPftLPPfNEeWPv-LVaBr3bG_DP2MrUEOHxWPy9o1gqLRyEyyzZZ1moB5VXInlJXDTvzNssPSZd3C4zl5SzXSQRYOgqnf8cY85pNbvIyB2MrPDjtQmQ318Mf0b8ekmr4GLCtzQIyGEFe-Ga6uMdvvbZKMJz2Akxo7sSm5FbfDCelS_JGATTBhv34ZGWRK7KOqk'
    },
    {
        email: 'john.doe@dashboard.com',
        name: 'John Doe',
        role: 'user',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD362EHTy7kuJU7Vxv8DpRLDqBiy6z9g_FMK4ntlIBOOL0EcMPBEtlc0CA5OEzJv5_IQdUUQdb7sl88y8XocUbKi8dNUehjqNCzJ1YaGF4-dAUBZCAwuhe8D0w4GaWt-KoI3URuyurFhEQJDp71vGQ0VUUEMJhnVI8KkQlFu6SgAfNzaTdspe5IFe5e9FjH94tvMFy91mXP4SncBd-SmcuJbDkYsUvGzfp7A387HJaEvU0CQOP_Ip8U7yCrM-J6bPPxvdX4dduNwCU'
    },
    {
        email: 'sarah.miller@dashboard.com',
        name: 'Sarah Miller',
        role: 'user',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9YsuO6sK72utOvfzo5Jne2g8J9QTj5SOI5jTPOSmRJlxSmw78pHZs7-gLEfxo6eZZKibrg5CnsPNdE5HaUUEWRBdExVtAZ0NRsFcRLdZ0AIyHWubSiDPPuhNm8dDNuF86ldTnbqL8rphLdU90yvFZT4uOxAnkwV5Kmp66LDZ0RjDhBQCp-XC2ZD3uFExS6YRzxszY7pxabHjtAtRlCSENuH8-0ysq6Uj9eY3tfxOg7Ybj6m6IXOdc-njYtgom2qp3oCM17UyeQ3o'
    },
    {
        email: 'mike.ross@dashboard.com',
        name: 'Mike Ross',
        role: 'user',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFDDypmtlBPdfEzDvVQOquca72AibF0rglR7FF9VQklla3mZQ6dqhoon9Sqs_zsSMimaAyEb1uhTMm4TPumNjgbWetmQeN2QW7McErDNFJM5-4rZVpkNRFlT8H7BW3GlrZ37jzS8s5xRmdW8QtpHPUoLJ4pV_Psv8cc9D2KOdGDZ0fPsQTBQfZ-pT6mcc8F0Eb4lTbXRoVDMt3CD5kYkyUMFDwAuLjk8Hg6oJ0oHI8EGNIcAN2cLQBVIg7TCLQpgxwehLyD-YVwLo'
    }
];

const assets = [
    {
        name: "MacBook Pro 16",
        model: "M3 Max, 64GB RAM",
        category: "Laptops",
        serial: "SN-MBP-2024-001",
        location: "Design Studio A",
        status: "active",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANZBAyoImGG5_Q-wm8bGlla5zeAybOeWHdzSy_2FHI8TR4lf6ZpxqNsfb0qioAzAcTE5FuvZk1HdFPftLPPfNEeWPv-LVaBr3bG_DP2MrUEOHxWPy9o1gqLRyEyyzZZ1moB5VXInlJXDTvzNssPSZd3C4zl5SzXSQRYOgqnf8cY85pNbvIyB2MrPDjtQmQ318Mf0b8ekmr4GLCtzQIyGEFe-Ga6uMdvvbZKMJz2Akxo7sSm5FbfDCelS_JGATTBhv34ZGWRK7KOqk",
        purchaseDate: new Date("2023-10-24"),
        value: 3499
    },
    {
        name: "Sony A7 IV",
        model: "Mirrorless Camera Body",
        category: "AV Gear",
        serial: "SN-CAM-8821-X",
        location: "Equipment Room B",
        status: "storage",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjfzBTcbiuO69jEqQ8_mxo2atfBZtTODl9H9ti_n9DSQtYNo4cbOKbnOTPLynQPHHr15r4H4Moei6ND9sEFhdmgVrIK30rwjcWe5P5kbL55VJ6C0d9ocNT1kNlU5vS3gteKR_oqSTNbe68putyej26usHE_SSoW85AlsNVb8aeEdZLRFHEh0WQ1-c4XIahugpYOafEHigs3DCi7KNyQI0lTIgU7ARmFPoSxZaJ1bH9_kkI7LCG2O2XktU8doEY0sOeqA0YBuU0j-4",
        purchaseDate: new Date("2023-09-12"),
        value: 2498
    },
    {
        name: "Dell Precision",
        model: "5000 Series",
        category: "Workstations",
        serial: "SN-DEL-9921",
        location: "Server Room",
        status: "maintenance",
        image: "",
        purchaseDate: new Date("2023-01-15"),
        value: 1899
    },
    {
        name: "Sennheiser MKH",
        model: "MKH 416 Shotgun",
        category: "Audio",
        serial: "SN-AUD-112",
        location: "Studio C",
        status: "active",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIoNrcrLpW9KzhEdYrlqdNoEBZKEuR-bBU8ckbhc11jzm6IQGFYOypiLQkdCyma_wTd1mOGWSfg8NxryXgeJLeCoZCF6l3WD7nWu4yYgUlldvxJGCxmPE3IdCkBhMkWa-M_BBS4i3eCGWpenZC9JgzIKEjtkAaRiF_l-m5bYze3BLOuXVmf8wP_7YWdqFxqm1Y0xFhCW1P-OR2kMjY5fgSDd6e9saW3kpDRe8gfFHMX3MV2Tt4UvZOqG8BaqIDDTsePPPDUdE54Rg",
        purchaseDate: new Date("2023-08-05"),
        value: 999
    },
    {
        name: "Key Light Air",
        model: "Elgato WiFi Panel",
        category: "Lighting",
        serial: "SN-LGT-554",
        location: "Streaming Booth",
        status: "retired",
        image: "",
        purchaseDate: new Date("2022-03-10"),
        value: 129
    },
    // Disposal items
    {
        name: "Dell Latitude 5420",
        model: "Latitude 5420",
        category: "Laptops",
        serial: "IT-LT-209",
        location: "HQ - IT Storage",
        status: "retired",
        image: "",
        purchaseDate: new Date("2020-01-01"),
        value: 800
    },
    {
        name: "HP LaserJet Pro M404",
        model: "M404dn",
        category: "Printers",
        serial: "IT-PRT-105",
        location: "Warehouse B",
        status: "retired",
        image: "",
        purchaseDate: new Date("2019-05-20"),
        value: 300
    },
    {
        name: "Cisco IP Phone 8845",
        model: "8845",
        category: "Phones",
        serial: "IT-PH-332",
        location: "Branch Office 2",
        status: "retired",
        image: "",
        purchaseDate: new Date("2021-02-15"),
        value: 200
    },
    {
        name: "iPad Pro 12.9 (2020)",
        model: "4th Gen",
        category: "Tablets",
        serial: "IT-TAB-055",
        location: "Remote User",
        status: "retired",
        image: "",
        purchaseDate: new Date("2020-11-10"),
        value: 900
    },
    {
        name: "Lenovo ThinkCentre M70",
        model: "M70q",
        category: "Desktops",
        serial: "IT-DT-401",
        location: "HQ - Floor 3",
        status: "retired",
        image: "",
        purchaseDate: new Date("2019-08-30"),
        value: 650
    }
];

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Asset.deleteMany({});
        await MaintenanceRecord.deleteMany({});
        await DisposalRecord.deleteMany({});

        console.log('Cleared existing data...');

        // Create Users
        const createdUsers = await User.insertMany(users);
        console.log(`Created ${createdUsers.length} users`);

        // Create Assets
        const createdAssets = await Asset.insertMany(assets);
        console.log(`Created ${createdAssets.length} assets`);

        // Create Maintenance Records
        const maintenanceTasks = [
            {
                asset: createdAssets.find(a => a.serial === "SN-MBP-2024-001")?._id, // Just mapped to random asset for demo if original not found
                technician: createdUsers.find(u => u.name === "John Doe")?._id,
                type: "Repair",
                status: "In Progress",
                visualProof: [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBOwuhqOIYnx02SM_HECtM9kZ4kNl8rGZcs8M0KaYUEquxwh4ITFAkyGoU4AmBVwxPah2hsCcad8n6ETsgqiYwKsWwHBsxHWZtVLYl9BtWX9nLgyPrbSiLGw0Y-IAFTWt0bCVXlaovRsU87XP1me9ioWR4x6pkm1Avh_Pn31VcHmshiqZVxk5YTcE8jWbTOCNq63DdUjFbSJhpeVdrSYCz618jK18JfY4-ZMRk6F6iVOc-nlLPi2JCBcVcLbFy0-ZMFynhoLWOHdrc"
                ]
            },
            {
                asset: createdAssets.find(a => a.serial === "SN-DEL-9921")?._id,
                technician: createdUsers.find(u => u.name === "Sarah Miller")?._id,
                type: "Routine",
                status: "Done",
                visualProof: [
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ5Wyjh6iu_q0yONauDX8FupU2rMlHRDlVa2b1LRTd94t9G6kygt6jyz2cnAUlntjlhpXp7G0H1czh8fbWDi108mgHwNnGbDiw_-e1DaMf3G32_3rXccCVw3_jccmUfSNTX-Bami9fzC5VH1k3UzD5b40_0GpLsO2YPesA1E2j_TegDuNaDgpdNejIYmCzpNDvIu8hgG75xf7nSCV81k2ruXoXzsYdDMD4biUu35nKf_fo2q_J-52roh_XqcDjvMgjlBcIH3KckUk",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuAseQqvCuzQwRw-SRUaeVZF8od6BrQhtVILKn-LnLgVNy-4B7XY5ExuKdndvxsRYYc-5r8XSY0loZhizMlT5Tg3Xf_GfqFAyOoAfYeh4yX11dM2kbcusGU6dHtErOdcdFtGwMTwnESqLLyl4GurgPNQYFm_9WuW9FX6F_qwaxuijgwEdL0ERjBPldwZI6F11o6xvlP0wSkyXYMSOKKY_EygBfR7AsCVx90S-49HPF2__e9yWJSUziTLa4zXWF0NE8WFXyEA6r2GrPQ"
                ]
            },
            {
                asset: createdAssets.find(a => a.serial === "SN-AUD-112")?._id,
                technician: createdUsers.find(u => u.name === "Mike Ross")?._id,
                type: "Repair",
                status: "Pending",
                visualProof: []
            }
        ].filter(t => t.asset && t.technician); // Filter out any where relations failed

        await MaintenanceRecord.insertMany(maintenanceTasks);
        console.log(`Created ${maintenanceTasks.length} maintenance records`);

        // Create Disposal Records
        const disposalRecords = [
            {
                asset: createdAssets.find(a => a.serial === "IT-LT-209")?._id,
                requestedBy: createdUsers.find(u => u.name === "John Doe")?._id,
                reason: "End of Life",
                status: "Pending Approval",
                location: "HQ - IT Storage",
                date: new Date("2024-10-24")
            },
            {
                asset: createdAssets.find(a => a.serial === "IT-PRT-105")?._id,
                requestedBy: createdUsers.find(u => u.name === "Sarah Miller")?._id,
                reason: "Damaged",
                status: "Scheduled",
                location: "Warehouse B",
                date: new Date("2024-10-23")
            },
            {
                asset: createdAssets.find(a => a.serial === "IT-PH-332")?._id,
                requestedBy: createdUsers.find(u => u.name === "Mike Ross")?._id,
                reason: "Upgrade",
                status: "Disposed",
                location: "Branch Office 2",
                date: new Date("2024-10-20")
            },
            {
                asset: createdAssets.find(a => a.serial === "IT-TAB-055")?._id,
                requestedBy: createdUsers.find(u => u.name === "John Doe")?._id,
                reason: "Lost/Stolen",
                status: "Compliance Check",
                location: "Remote User",
                date: new Date("2024-10-18")
            },
            {
                asset: createdAssets.find(a => a.serial === "IT-DT-401")?._id,
                requestedBy: createdUsers.find(u => u.name === "John Doe")?._id,
                reason: "End of Life",
                status: "Disposed",
                location: "HQ - Floor 3",
                date: new Date("2024-10-15")
            }
        ].filter(d => d.asset && d.requestedBy);

        await DisposalRecord.insertMany(disposalRecords);
        console.log(`Created ${disposalRecords.length} disposal records`);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
