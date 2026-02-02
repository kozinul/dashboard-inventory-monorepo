import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const createSuperUser = async () => {
    try {
        await connectDB();

        const superUsername = 'superuser';
        const existingUser = await User.findOne({ username: superUsername });

        if (existingUser) {
            console.log('Super User already exists');
            process.exit(0);
        }

        const superUser = await User.create({
            username: superUsername,
            name: 'Super User',
            email: 'superuser@example.com',
            password: 'password123', // Will be hashed by pre-save hook
            role: 'superuser',
            status: 'Active',
            designation: 'System Administrator',
            department: 'IT',
        });

        console.log(`Super User created: ${(superUser as any).username}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating super user:', error);
        process.exit(1);
    }
};

createSuperUser();
