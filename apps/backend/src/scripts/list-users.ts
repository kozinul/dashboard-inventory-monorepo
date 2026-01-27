import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const listUsers = async () => {
    try {
        await connectDB();
        console.log('Connected to DB. Fetching users...');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        console.table(users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status
        })));

        process.exit(0);
    } catch (error) {
        console.error('Error fetching users:', error);
        process.exit(1);
    }
};

listUsers();
