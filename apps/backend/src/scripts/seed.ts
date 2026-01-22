import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seed = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        await User.create({
            email: adminEmail,
            password: adminPassword, // In real app, hash this!
            fullName: 'System Admin',
            role: 'admin',
            isActive: true
        });

        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
