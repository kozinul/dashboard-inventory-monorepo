import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const createSuperUser = async () => {
    try {
        await connectDB();

        const superUserEmail = 'superuser@example.com';
        const existingUser = await User.findOne({ email: superUserEmail });

        if (existingUser) {
            console.log('Super User already exists');
            process.exit(0);
        }

        const superUser = await User.create({
            name: 'Super User',
            email: superUserEmail,
            password: 'password123', // Will be hashed by pre-save hook
            role: 'superuser',
            status: 'Active',
            designation: 'System Administrator',
            department: 'IT',
            // departmentId: null - Super users might not need a department or belong to a special one
        });

        console.log(`Super User created: ${superUser.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating super user:', error);
        process.exit(1);
    }
};

createSuperUser();
