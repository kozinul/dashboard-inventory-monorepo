import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const inspectUser = async (name: string) => {
    try {
        await connectDB();
        const user = await User.findOne({
            $or: [
                { name: new RegExp(name, 'i') },
                { username: new RegExp(name, 'i') }
            ]
        });

        if (user) {
            console.log('User found:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const userName = process.argv[2] || 'tony';
inspectUser(userName);
